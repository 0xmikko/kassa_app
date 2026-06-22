#!/usr/bin/env ts-node

import * as fs from 'fs';
import * as path from 'path';
import {jsPDF} from 'jspdf';
import JsBarcode from 'jsbarcode';
import {createCanvas} from 'canvas';

// Define interfaces for the product data structure
interface ProductMetadata {
  version: string;
  lastUpdated: string;
  description: string;
  totalProducts: number;
}

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
}

interface ProductData {
  metadata: ProductMetadata;
  products: Product[];
}

// Configuration for PDF layout - Small toy labels
const PDF_CONFIG = {
  pageWidth: 210, // A4 width in mm
  pageHeight: 297, // A4 height in mm
  margin: 8,
  barcodeWidth: 40, // Smaller barcode for toys
  barcodeHeight: 12, // Reduced height
  itemsPerRow: 4, // More labels per row
  itemHeight: 28, // Compact height
  fontSize: 6, // Smaller font
  titleFontSize: 7, // Smaller title font
};

class BarcodePDFGenerator {
  private pdf: jsPDF;
  private currentY: number;
  private currentX: number;
  private itemsInCurrentRow: number;

  constructor() {
    this.pdf = new jsPDF('portrait', 'mm', 'a4');
    this.currentY = PDF_CONFIG.margin;
    this.currentX = PDF_CONFIG.margin;
    this.itemsInCurrentRow = 0;
  }

  /**
   * Load products from JSON file
   */
  private loadProducts(): Product[] {
    try {
      const dataPath = path.join(__dirname, '../data/products.json');
      console.log('Loading from path:', dataPath);
      const jsonData = fs.readFileSync(dataPath, 'utf8');
      const productData: ProductData = JSON.parse(jsonData);

      // Debug: Log some product names to verify we're reading the updated data
      console.log('Sample product names from loaded data:');
      productData.products.slice(5, 8).forEach((product, index) => {
        console.log(`  Product ${index + 6}: "${product.name}"`);
      });
      console.log('Also checking products 13 and 15:');
      console.log(`  Product 13: "${productData.products[12]?.name}"`);
      console.log(`  Product 15: "${productData.products[14]?.name}"`);

      // Check file modification time
      const stats = fs.statSync(dataPath);
      console.log('File last modified:', stats.mtime);

      return productData.products;
    } catch (error) {
      console.error('Error loading products:', error);
      throw new Error('Failed to load products from JSON file');
    }
  }

  /**
   * Calculate EAN13 check digit
   */
  private calculateEAN13CheckDigit(code: string): string {
    // Take first 12 digits
    const digits = code.substring(0, 12).split('').map(Number);

    // Calculate check digit using EAN13 algorithm
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += digits[i] * (i % 2 === 0 ? 1 : 3);
    }

    const checkDigit = (10 - (sum % 10)) % 10;
    return code.substring(0, 12) + checkDigit;
  }

  /**
   * Validate and convert product ID to EAN13 format
   */
  private toEAN13(productId: string): string {
    // Remove any non-numeric characters
    const numericOnly = productId.replace(/\D/g, '');

    // Check if the original product ID contains non-numeric characters
    if (productId !== numericOnly) {
      const expectedId = this.calculateEAN13CheckDigit(
        numericOnly.padStart(12, '0').substring(0, 12),
      );
      throw new Error(
        `Invalid EAN13 format for product ID "${productId}". ` +
          `EAN13 codes must contain only numeric characters. ` +
          `Expected format: "${expectedId}"`,
      );
    }

    // Check if the ID is the correct length (12 or 13 digits)
    if (numericOnly.length < 12) {
      const expectedId = this.calculateEAN13CheckDigit(
        numericOnly.padStart(12, '0'),
      );
      throw new Error(
        `Invalid EAN13 format for product ID "${productId}". ` +
          `EAN13 codes must be 12-13 digits long. Current length: ${numericOnly.length}. ` +
          `Expected format: "${expectedId}"`,
      );
    }

    if (numericOnly.length > 13) {
      const expectedId = this.calculateEAN13CheckDigit(
        numericOnly.substring(0, 12),
      );
      throw new Error(
        `Invalid EAN13 format for product ID "${productId}". ` +
          `EAN13 codes must be 12-13 digits long. Current length: ${numericOnly.length}. ` +
          `Expected format: "${expectedId}"`,
      );
    }

    // If 12 digits, add check digit
    if (numericOnly.length === 12) {
      return this.calculateEAN13CheckDigit(numericOnly);
    }

    // If 13 digits, validate the check digit
    if (numericOnly.length === 13) {
      const expectedCode = this.calculateEAN13CheckDigit(numericOnly);
      if (numericOnly !== expectedCode) {
        throw new Error(
          `Invalid EAN13 check digit for product ID "${productId}". ` +
            `The check digit is incorrect. ` +
            `Expected format: "${expectedCode}"`,
        );
      }
      return numericOnly;
    }

    // This should never be reached, but just in case
    throw new Error(`Unexpected error processing product ID "${productId}"`);
  }

  /**
   * Generate barcode as base64 image
   */
  private generateBarcode(code: string): string {
    const canvas = createCanvas(
      PDF_CONFIG.barcodeWidth * 6, // Higher resolution for small barcodes
      PDF_CONFIG.barcodeHeight * 6,
    );

    // Convert to valid EAN13 format
    const ean13Code = this.toEAN13(code);

    JsBarcode(canvas, ean13Code, {
      format: 'EAN13',
      width: 1.5, // Thinner bars for small labels
      height: 40, // Shorter height
      displayValue: false,
      margin: 1, // Minimal margin
    });

    return canvas.toDataURL('image/png');
  }

  /**
   * Add a new page if needed
   */
  private checkNewPage(): void {
    if (
      this.currentY + PDF_CONFIG.itemHeight >
      PDF_CONFIG.pageHeight - PDF_CONFIG.margin
    ) {
      this.pdf.addPage();
      this.currentY = PDF_CONFIG.margin;
      this.currentX = PDF_CONFIG.margin;
      this.itemsInCurrentRow = 0;
    }
  }

  /**
   * Move to next position
   */
  private moveToNextPosition(): void {
    this.itemsInCurrentRow++;

    if (this.itemsInCurrentRow >= PDF_CONFIG.itemsPerRow) {
      // Move to next row
      this.currentY += PDF_CONFIG.itemHeight;
      this.currentX = PDF_CONFIG.margin;
      this.itemsInCurrentRow = 0;
    } else {
      // Move to next column
      this.currentX +=
        (PDF_CONFIG.pageWidth - 2 * PDF_CONFIG.margin) / PDF_CONFIG.itemsPerRow;
    }
  }

  /**
   * Add a product with barcode to the PDF
   */
  private addProductToPDF(product: Product): void {
    this.checkNewPage();

    try {
      // Generate barcode
      const barcodeDataUrl = this.generateBarcode(product.id);

      // Add barcode image
      this.pdf.addImage(
        barcodeDataUrl,
        'PNG',
        this.currentX,
        this.currentY,
        PDF_CONFIG.barcodeWidth,
        PDF_CONFIG.barcodeHeight,
      );

      // Add product ID below barcode
      this.pdf.setFontSize(PDF_CONFIG.fontSize);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.text(
        product.id,
        this.currentX + PDF_CONFIG.barcodeWidth / 2,
        this.currentY + PDF_CONFIG.barcodeHeight + 3,
        {align: 'center'},
      );

      // Add product name (shorter for toy labels)
      this.pdf.setFontSize(PDF_CONFIG.titleFontSize);
      this.pdf.setFont('helvetica', 'bold');

      // Truncate long product names for small labels
      let productName = product.name;
      if (productName.length > 20) {
        productName = productName.substring(0, 17) + '...';
      }

      this.pdf.text(
        productName,
        this.currentX + PDF_CONFIG.barcodeWidth / 2,
        this.currentY + PDF_CONFIG.barcodeHeight + 9,
        {align: 'center', maxWidth: PDF_CONFIG.barcodeWidth},
      );

      // Add price (compact)
      this.pdf.setFontSize(PDF_CONFIG.fontSize);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text(
        `€${product.price.toFixed(2)}`,
        this.currentX + PDF_CONFIG.barcodeWidth / 2,
        this.currentY + PDF_CONFIG.barcodeHeight + 15,
        {align: 'center'},
      );

      // Skip category for toy labels to save space

      // Reset text color
      this.pdf.setTextColor(0, 0, 0);
    } catch (error) {
      console.error(
        `Error generating barcode for product ${product.id}:`,
        error,
      );

      // Add error placeholder
      this.pdf.setFontSize(PDF_CONFIG.fontSize);
      this.pdf.setTextColor(255, 0, 0);
      this.pdf.text(
        'Barcode Error',
        this.currentX + PDF_CONFIG.barcodeWidth / 2,
        this.currentY + PDF_CONFIG.barcodeHeight / 2,
        {align: 'center'},
      );
      this.pdf.setTextColor(0, 0, 0);
    }

    this.moveToNextPosition();
  }

  /**
   * Add header to the PDF
   */
  private addHeader(): void {
    this.pdf.setFontSize(14);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text(
      'Toy Barcode Labels - Small Size',
      PDF_CONFIG.pageWidth / 2,
      18,
      {
        align: 'center',
      },
    );

    this.pdf.setFontSize(8);
    this.pdf.setFont('helvetica', 'normal');
    const date = new Date().toLocaleDateString();
    this.pdf.text(`Generated on: ${date}`, PDF_CONFIG.pageWidth / 2, 24, {
      align: 'center',
    });

    this.currentY = 30;
  }

  /**
   * Generate the complete PDF
   */
  public generatePDF(): void {
    console.log('Loading products...');
    const products = this.loadProducts();
    console.log(`Found ${products.length} products`);

    console.log('Generating PDF...');
    this.addHeader();

    // Add each product to the PDF
    products.forEach((product, index) => {
      console.log(
        `Processing product ${index + 1}/${products.length}: ${product.name}`,
      );
      this.addProductToPDF(product);
    });

    // Save the PDF
    const outputPath = path.join(__dirname, '../output');
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, {recursive: true});
    }

    const fileName = `toy-barcode-labels-small-${
      new Date().toISOString().split('T')[0]
    }.pdf`;
    const filePath = path.join(outputPath, fileName);

    this.pdf.save(filePath);
    console.log(`PDF generated successfully: ${filePath}`);
    console.log(`Total products processed: ${products.length}`);
  }
}

// Main execution
if (require.main === module) {
  try {
    const generator = new BarcodePDFGenerator();
    generator.generatePDF();
  } catch (error) {
    console.error('Error generating PDF:', error);
    process.exit(1);
  }
}

export default BarcodePDFGenerator;
