import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LogoUpload } from "@/components/profile/logo-upload";

vi.mock("@/lib/auth/session", () => ({
  getAccessTokenFromStorage: vi.fn(() => "test-token"),
  redirectToLogin: vi.fn(),
}));

vi.mock("@/lib/api/profile-api", () => ({
  uploadInvoiceLogo: vi.fn(),
}));

function createFile(name: string, sizeBytes: number, type = "image/png"): File {
  const buf = new ArrayBuffer(sizeBytes);
  return new File([buf], name, { type });
}

// Stub Image so dimension reading resolves immediately.
function stubImageLoading(width = 200, height = 200) {
  const original = globalThis.Image;
  class FakeImage {
    naturalWidth = width;
    naturalHeight = height;
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    set src(_: string) {
      setTimeout(() => this.onload?.(), 0);
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  globalThis.Image = FakeImage as any;
  return () => {
    globalThis.Image = original;
  };
}

describe("LogoUpload", () => {
  let restoreImage: () => void;
  const onUploaded = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    restoreImage = stubImageLoading();
    URL.createObjectURL = vi.fn(() => "blob:preview");
    URL.revokeObjectURL = vi.fn();

    // Minimal canvas stubs for resize path
    HTMLCanvasElement.prototype.getContext = vi.fn(
      () =>
        ({
          drawImage: vi.fn(),
        }) as unknown as CanvasRenderingContext2D,
    );

    HTMLCanvasElement.prototype.toBlob = vi.fn((callback: BlobCallback) => {
      callback(new Blob(["x"], { type: "image/png" }));
    });

    // Stub FileReader for data URL preview caching
    class FakeFileReader {
      result: string | ArrayBuffer | null = null;
      onload: ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null = null;
      onerror: ((this: FileReader, ev: ProgressEvent<FileReader>) => void) | null = null;
      readAsDataURL() {
        this.result = "data:image/png;base64,TEST";
        const ev = new ProgressEvent("load") as ProgressEvent<FileReader>;
        setTimeout(() => this.onload?.(ev), 0);
      }
    }
    globalThis.FileReader = FakeFileReader as unknown as typeof FileReader;
  });

  afterEach(() => {
    cleanup();
    restoreImage();
  });

  it("renders heading, help text and file input", () => {
    render(<LogoUpload currentLogoUrl={null} onUploaded={onUploaded} />);
    expect(screen.getByText("Logo facture")).toBeInTheDocument();
    expect(screen.getByText(/PNG, JPEG ou WebP/)).toBeInTheDocument();
    expect(screen.getByLabelText(/sélectionner un fichier logo/i)).toBeInTheDocument();
    expect(screen.getByText("Aucun logo")).toBeInTheDocument();
  });

  it("shows preview when currentLogoUrl is provided", () => {
    render(<LogoUpload currentLogoUrl="https://example.com/logo.png" onUploaded={onUploaded} />);
    const img = screen.getByAltText("Aperçu du logo");
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "https://example.com/logo.png");
    expect(screen.getByRole("button", { name: /remplacer le logo/i })).toBeInTheDocument();
  });

  it("shows button 'Choisir un logo' when no logo exists", () => {
    render(<LogoUpload currentLogoUrl={null} onUploaded={onUploaded} />);
    expect(screen.getByRole("button", { name: /choisir un logo/i })).toBeInTheDocument();
  });

  it("rejects unsupported file types with French message", async () => {
    render(<LogoUpload currentLogoUrl={null} onUploaded={onUploaded} />);

    const input = screen.getByLabelText(/sélectionner un fichier logo/i) as HTMLInputElement;
    const badFile = createFile("virus.svg", 1024, "image/svg+xml");

    // fireEvent bypasses the HTML accept filter so the handler sees the bad type
    fireEvent.change(input, { target: { files: [badFile] } });

    await waitFor(() => {
      expect(screen.getByText(/format non supporté/i)).toBeInTheDocument();
    });
    expect(onUploaded).not.toHaveBeenCalled();
  });

  it("rejects files larger than 2 MB with French message", async () => {
    const user = userEvent.setup();
    render(<LogoUpload currentLogoUrl={null} onUploaded={onUploaded} />);

    const input = screen.getByLabelText(/sélectionner un fichier logo/i);
    const bigFile = createFile("huge.png", 3 * 1024 * 1024, "image/png");

    await user.upload(input, bigFile);

    await waitFor(() => {
      expect(screen.getByText(/fichier trop volumineux/i)).toBeInTheDocument();
    });
    expect(onUploaded).not.toHaveBeenCalled();
  });

  it("auto-resizes images exceeding backend max dimensions and uploads", async () => {
    restoreImage();
    restoreImage = stubImageLoading(4000, 3000);

    const { uploadInvoiceLogo } = await import("@/lib/api/profile-api");
    vi.mocked(uploadInvoiceLogo).mockResolvedValue({
      logoStorageKey: "logos/resized.png",
      logoUrl: "http://localhost:3001/uploads/logos/resized.png",
      logoUpdatedAt: "2026-04-16T10:00:00Z",
    });

    const user = userEvent.setup();
    render(<LogoUpload currentLogoUrl={null} onUploaded={onUploaded} />);

    const input = screen.getByLabelText(/sélectionner un fichier logo/i);
    const file = createFile("big-dims.png", 1024, "image/png");

    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText(/logo enregistré/i)).toBeInTheDocument();
    });

    expect(uploadInvoiceLogo).toHaveBeenCalled();
    const call = vi.mocked(uploadInvoiceLogo).mock.calls[0];
    expect(call?.[0]).toBe("test-token");
    expect(call?.[1]).toBeInstanceOf(File);
    expect((call?.[1] as File).name).toMatch(/logo\.(png|jpg)$/);
  });

  it("uploads valid file and calls onUploaded on success", async () => {
    const { uploadInvoiceLogo } = await import("@/lib/api/profile-api");
    vi.mocked(uploadInvoiceLogo).mockResolvedValue({
      logoStorageKey: "logos/abc.png",
      logoUrl: "http://localhost:3001/uploads/logos/abc.png",
      logoUpdatedAt: "2026-04-16T10:00:00Z",
    });

    const user = userEvent.setup();
    render(<LogoUpload currentLogoUrl={null} onUploaded={onUploaded} />);

    const input = screen.getByLabelText(/sélectionner un fichier logo/i);
    const file = createFile("logo.png", 500_000, "image/png");

    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText(/logo enregistré/i)).toBeInTheDocument();
    });

    expect(uploadInvoiceLogo).toHaveBeenCalledWith("test-token", file);
    expect(onUploaded).toHaveBeenCalledWith({
      logoStorageKey: "logos/abc.png",
      logoUrl: "data:image/png;base64,TEST",
      logoUpdatedAt: "2026-04-16T10:00:00Z",
    });
  });

  it("shows error message when upload API fails", async () => {
    const { uploadInvoiceLogo } = await import("@/lib/api/profile-api");
    vi.mocked(uploadInvoiceLogo).mockRejectedValue(
      new Error("L'API ne supporte pas encore l'envoi du logo (endpoint manquant)."),
    );

    const user = userEvent.setup();
    render(<LogoUpload currentLogoUrl={null} onUploaded={onUploaded} />);

    const input = screen.getByLabelText(/sélectionner un fichier logo/i);
    const file = createFile("logo.png", 500_000, "image/png");

    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText(/endpoint manquant/i)).toBeInTheDocument();
    });
    expect(onUploaded).not.toHaveBeenCalled();
  });

  it("replaces existing logo on successful upload", async () => {
    const { uploadInvoiceLogo } = await import("@/lib/api/profile-api");
    vi.mocked(uploadInvoiceLogo).mockResolvedValue({
      logoStorageKey: "logos/new.png",
      logoUrl: "http://localhost:3001/uploads/logos/new.png",
      logoUpdatedAt: "2026-04-16T11:00:00Z",
    });

    const user = userEvent.setup();
    render(
      <LogoUpload
        currentLogoUrl="http://localhost:3001/uploads/logos/old.png"
        onUploaded={onUploaded}
      />,
    );

    expect(screen.getByAltText("Aperçu du logo")).toHaveAttribute(
      "src",
      "http://localhost:3001/uploads/logos/old.png",
    );

    const input = screen.getByLabelText(/sélectionner un fichier logo/i);
    const file = createFile("new-logo.webp", 100_000, "image/webp");

    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText(/logo enregistré/i)).toBeInTheDocument();
    });

    expect(screen.getByAltText("Aperçu du logo")).toHaveAttribute(
      "src",
      "data:image/png;base64,TEST",
    );
  });
});
