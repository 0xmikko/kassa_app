# Barcode PDF Generator

This script generates a PDF file with barcodes and product information for all products in the `data/products.json` file.

## Features

- Reads products from `data/products.json`
- Generates CODE128 barcodes for each product ID
- Creates a printable PDF with **small labels perfect for toys**:
  - Compact barcode (40mm x 12mm)
  - Product ID
  - Product name (truncated for small labels)
  - Price in euros
  - **4 labels per row** for efficient printing

## Usage

### Run the script directly:
```bash
npm run generate-barcodes
```

### Or run with ts-node:
```bash
npx ts-node scripts/generate-barcode-pdf.ts
```

## Output

The generated PDF will be saved in the `output/` directory with the filename format:
`toy-barcode-labels-small-YYYY-MM-DD.pdf`

### Label Specifications
- **Size**: 40mm x 28mm (perfect for small toys)
- **Layout**: 4 labels per row, multiple rows per page
- **Content**: Barcode, product name, and price only (category removed to save space)
- **Print ready**: A4 format with proper margins

## Configuration

You can modify the PDF layout by editing the `PDF_CONFIG` object in the script:

- `pageWidth` / `pageHeight`: PDF dimensions in mm (default: A4)
- `margin`: Page margins in mm
- `barcodeWidth` / `barcodeHeight`: Barcode dimensions in mm (current: 40x12mm for toys)
- `itemsPerRow`: Number of labels per row (current: 4 for small labels)
- `itemHeight`: Height of each label section in mm (current: 28mm)
- `fontSize` / `titleFontSize`: Font sizes for different text elements (optimized for small labels)

## Dependencies

- `jspdf`: PDF generation
- `jsbarcode`: Barcode generation
- `canvas`: Required for barcode rendering in Node.js
- `ts-node`: TypeScript execution

## Error Handling

If a barcode cannot be generated for a product, the script will:
- Log an error message
- Add a "Barcode Error" placeholder in the PDF
- Continue processing other products 