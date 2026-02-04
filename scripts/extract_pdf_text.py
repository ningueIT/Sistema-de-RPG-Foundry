from __future__ import annotations

from pathlib import Path
import sys

from pypdf import PdfReader


def main() -> None:
    default_pdf = Path(__file__).resolve().parent.parent / "Guia_Detalhado_CD_de_Resistência_de_Técnica.pdf"
    pdf_path = Path(sys.argv[1]).expanduser().resolve() if len(sys.argv) > 1 else default_pdf
    print("PDF:", pdf_path)
    print("exists:", pdf_path.exists())
    reader = PdfReader(str(pdf_path))
    print("pages:", len(reader.pages))

    for index, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""
        normalized = " ".join(text.split())
        print(f"\n--- PAGE {index} ---")
        print(normalized)


if __name__ == "__main__":
    main()
