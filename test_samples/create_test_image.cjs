const sharp = require('sharp');
const fs = require('fs');

async function createTestImage() {
  try {
    // Create a simple white background image with black text
    const width = 800;
    const height = 600;
    
    // Create SVG content with test text
    const svgContent = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="white"/>
        <text x="50" y="80" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="black">OCR TEST DOCUMENT</text>
        <text x="50" y="140" font-family="Arial, sans-serif" font-size="24" fill="black">Sample Text for Vision API Testing</text>
        <text x="50" y="200" font-family="Arial, sans-serif" font-size="18" fill="black">This document contains:</text>
        <text x="70" y="240" font-family="Arial, sans-serif" font-size="16" fill="black">• Numbers: 1234567890</text>
        <text x="70" y="270" font-family="Arial, sans-serif" font-size="16" fill="black">• Letters: ABCdef</text>
        <text x="70" y="300" font-family="Arial, sans-serif" font-size="16" fill="black">• Symbols: !@#$%</text>
        <text x="50" y="360" font-family="Arial, sans-serif" font-size="18" fill="black">Medical: Patient Diagnosis Treatment</text>
        <text x="50" y="400" font-family="Arial, sans-serif" font-size="18" fill="black">Legal: Contract Agreement Evidence</text>
        <text x="50" y="440" font-family="Arial, sans-serif" font-size="18" fill="black">Finance: Invoice Balance Transaction</text>
        <text x="50" y="500" font-family="Arial, sans-serif" font-size="16" fill="black">Date: September 11, 2025</text>
        <text x="50" y="540" font-family="Arial, sans-serif" font-size="16" fill="black">Status: ACTIVE | Confidence: HIGH</text>
      </svg>
    `;
    
    // Convert SVG to PNG
    await sharp(Buffer.from(svgContent))
      .png()
      .toFile('test_samples/sample_ocr_test.png');
    
    // Create a second test image with different content
    const svgContent2 = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="white"/>
        <text x="50" y="80" font-family="Arial, sans-serif" font-size="28" font-weight="bold" fill="black">REAL ESTATE CONTRACT</text>
        <text x="50" y="140" font-family="Arial, sans-serif" font-size="20" fill="black">Property Address: 123 Main St, Anytown, CA 90210</text>
        <text x="50" y="180" font-family="Arial, sans-serif" font-size="18" fill="black">Purchase Price: $750,000</text>
        <text x="50" y="220" font-family="Arial, sans-serif" font-size="18" fill="black">Buyer: John Smith</text>
        <text x="50" y="260" font-family="Arial, sans-serif" font-size="18" fill="black">Seller: Jane Doe</text>
        <text x="50" y="300" font-family="Arial, sans-serif" font-size="18" fill="black">Closing Date: October 15, 2025</text>
        <text x="50" y="340" font-family="Arial, sans-serif" font-size="18" fill="black">Contingencies: Inspection, Financing</text>
        <text x="50" y="380" font-family="Arial, sans-serif" font-size="18" fill="black">Agent: Bob Wilson, License #12345678</text>
        <text x="50" y="450" font-family="Arial, sans-serif" font-size="16" fill="black">This contract contains all essential terms</text>
        <text x="50" y="480" font-family="Arial, sans-serif" font-size="16" fill="black">and conditions for the property sale.</text>
        <text x="50" y="540" font-family="Arial, sans-serif" font-size="14" fill="black">Document ID: RE-2025-0911-001</text>
      </svg>
    `;
    
    await sharp(Buffer.from(svgContent2))
      .png()
      .toFile('test_samples/sample_real_estate.png');
    
    console.log('✅ Test images created successfully!');
    console.log('📄 Files created:');
    console.log('  - test_samples/sample_ocr_test.png');
    console.log('  - test_samples/sample_real_estate.png');
    
  } catch (error) {
    console.error('❌ Error creating test images:', error);
    process.exit(1);
  }
}

createTestImage();