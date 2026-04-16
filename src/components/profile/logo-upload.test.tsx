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
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    restoreImage = stubImageLoading();
    global.fetch = vi.fn();
    URL.createObjectURL = vi.fn(() => "blob:preview");
    URL.revokeObjectURL = vi.fn();

    // Minimal canvas stubs for resize path
    HTMLCanvasElement.prototype.getContext = vi.fn(
      () =>
        ({
          drawImage: vi.fn(),
        }) as unknown as CanvasRenderingContext2D,
    ) as unknown as typeof HTMLCanvasElement.prototype.getContext;

    HTMLCanvasElement.prototype.toBlob = vi.fn((callback: BlobCallback) => {
      callback(new Blob(["x"], { type: "image/png" }));
    });

    // Stub FileReader for data URL preview caching
    class FakeFileReader {
      // Minimal shape to satisfy TypeScript when used as FileReader.
      error: DOMException | null = null;
      readyState = 2;
      abort() {}
      result: string | ArrayBuffer | null = null;
      onload: ((ev: ProgressEvent<FileReader>) => void) | null = null;
      onerror: ((ev: ProgressEvent<FileReader>) => void) | null = null;
      onabort: ((ev: ProgressEvent<FileReader>) => void) | null = null;
      onloadend: ((ev: ProgressEvent<FileReader>) => void) | null = null;
      onloadstart: ((ev: ProgressEvent<FileReader>) => void) | null = null;
      onprogress: ((ev: ProgressEvent<FileReader>) => void) | null = null;
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
    global.fetch = originalFetch;
  });

  it("renders heading, help text and file input", () => {
    render(<LogoUpload currentLogoUrl={null} onUploaded={onUploaded} />);
    expect(screen.getByText("Logo facture")).toBeInTheDocument();
    expect(screen.getByText(/PNG, JPEG ou WebP/)).toBeInTheDocument();
    expect(screen.getByLabelText(/sélectionner un fichier logo/i)).toBeInTheDocument();
    expect(screen.getByText("Aucun logo")).toBeInTheDocument();
  });

  it("loads preview by calling backend logo route when currentLogoUrl is provided", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      blob: async () => new Blob(["x"], { type: "image/png" }),
    } as Response);

    render(
      <LogoUpload
        currentLogoUrl="http://localhost:3001/api/v1/users/profile/logo?v=1"
        onUploaded={onUploaded}
      />,
    );

    await waitFor(() => {
      expect(screen.getByAltText("Aperçu du logo")).toBeInTheDocument();
    });
    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(screen.getByAltText("Aperçu du logo")).toHaveAttribute("src", "blob:preview");
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
      logoUrl: "http://localhost:3001/api/v1/users/profile/logo?v=2026-04-16T10:00:00Z",
      logoUpdatedAt: "2026-04-16T10:00:00Z",
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      blob: async () => new Blob(["x"], { type: "image/png" }),
    } as Response);

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
      logoUrl: "http://localhost:3001/api/v1/users/profile/logo?v=2026-04-16T10:00:00Z",
      logoUpdatedAt: "2026-04-16T10:00:00Z",
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      blob: async () => new Blob(["x"], { type: "image/png" }),
    } as Response);

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
      logoUrl: "http://localhost:3001/api/v1/users/profile/logo?v=2026-04-16T10:00:00Z",
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
      logoUrl: "http://localhost:3001/api/v1/users/profile/logo?v=2026-04-16T11:00:00Z",
      logoUpdatedAt: "2026-04-16T11:00:00Z",
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      blob: async () => new Blob(["x"], { type: "image/png" }),
    } as Response);

    const user = userEvent.setup();
    render(
      <LogoUpload
        currentLogoUrl="http://localhost:3001/api/v1/users/profile/logo?v=2026-04-16T10:00:00Z"
        onUploaded={onUploaded}
      />,
    );

    await waitFor(() => {
      expect(screen.getByAltText("Aperçu du logo")).toBeInTheDocument();
    });

    const input = screen.getByLabelText(/sélectionner un fichier logo/i);
    const file = createFile("new-logo.webp", 100_000, "image/webp");

    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText(/logo enregistré/i)).toBeInTheDocument();
    });

    expect(screen.getByAltText("Aperçu du logo")).toHaveAttribute("src", "blob:preview");
  });
});
