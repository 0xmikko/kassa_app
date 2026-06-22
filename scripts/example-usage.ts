#!/usr/bin/env ts-node

import BarcodePDFGenerator from './generate-barcode-pdf';

// Example of how to use the BarcodePDFGenerator class
async function generateBarcodeLabels() {
  console.log('🏷️  Starting barcode label generation...');

  try {
    const generator = new BarcodePDFGenerator();
    generator.generatePDF();

    console.log('✅ Barcode labels generated successfully!');
    console.log('📄 Check the output/ directory for your PDF file');
  } catch (error) {
    console.error('❌ Error generating barcode labels:', error);
    process.exit(1);
  }
}

// Run the example
if (require.main === module) {
  generateBarcodeLabels();
}
