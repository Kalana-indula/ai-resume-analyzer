export interface PdfConversionResult {
    imageUrl: string;
    file: File | null;
    error?: string;
}

let pdfjsLib: any = null;
let isLoading = false;
let loadPromise: Promise<any> | null = null;
let pdfWorker: Worker | null = null;

async function loadPdfJs(): Promise<any> {
    if (pdfjsLib) return pdfjsLib;
    if (loadPromise) return loadPromise;

    if (typeof window === "undefined") {
        throw new Error("PDF.js can only be loaded in the browser");
    }

    isLoading = true;
    // // @ts-expect-error - pdfjs-dist/build/pdf.mjs is not a module
    // loadPromise = import("pdfjs-dist/build/pdf.mjs").then((lib) => {
    //     // Set the worker source to use local file
    //     lib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    //     pdfjsLib = lib;
    //     isLoading = false;
    //     return lib;
    // });

    loadPromise = import("pdfjs-dist/build/pdf.mjs")
        .then(async (lib) => {
            if (!pdfWorker) {
                const workerUrl = new URL(
                    "pdfjs-dist/build/pdf.worker.min.mjs",
                    import.meta.url
                );
                pdfWorker = new Worker(workerUrl, { type: "module" });
            }

            lib.GlobalWorkerOptions.workerPort = pdfWorker;
            pdfjsLib = lib;
            isLoading = false;
            return lib;
        })
        .catch((error) => {
            isLoading = false;
            loadPromise = null;
            throw error;
        });


    return loadPromise;
}

export async function convertPdfToImage(
    file: File
): Promise<PdfConversionResult> {
    try {
        const lib = await loadPdfJs();

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await lib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);

        const viewport = page.getViewport({ scale: 4 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        if (context) {
            context.imageSmoothingEnabled = true;
            context.imageSmoothingQuality = "high";
        }

        await page.render({ canvasContext: context!, viewport }).promise;

        return new Promise((resolve) => {
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        // Create a File from the blob with the same name as the pdf
                        const originalName = file.name.replace(/\.pdf$/i, "");
                        const imageFile = new File([blob], `${originalName}.png`, {
                            type: "image/png",
                        });

                        resolve({
                            imageUrl: URL.createObjectURL(blob),
                            file: imageFile,
                        });
                    } else {
                        resolve({
                            imageUrl: "",
                            file: null,
                            error: "Failed to create image blob",
                        });
                    }
                },
                "image/png",
                1.0
            ); // Set quality to maximum (1.0)
        });
    } catch (err) {
        return {
            imageUrl: "",
            file: null,
            error: `Failed to convert PDF: ${err}`,
        };
    }
}