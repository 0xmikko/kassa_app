# 🛒 Kids Shop Kassa App

A fun and educational React Native app designed for kids to play shop! This app simulates a real cash register (kassa) experience where children can scan product barcodes and manage a shopping cart.

## Features

- 📱 **iPad-optimized interface** - Designed specifically for tablet use
- 📷 **Real-time barcode scanning** - Camera is always active for instant scanning
- 🛍️ **Shopping cart management** - Add, remove, and update product quantities
- 💰 **Price calculation** - Automatic total calculation with checkout functionality
- 🎮 **Kid-friendly UI** - Large buttons, clear text, and intuitive design
- 🔄 **Reset functionality** - Easy checkout process that clears the cart
- 📊 **Organized product database** - JSON-based product management with categories

## Supported Barcode Types

- QR codes
- EAN-13 barcodes
- EAN-8 barcodes
- UPC-A barcodes

## Product Database

The app uses a JSON-based product database located in `data/products.json`. The current database includes:

- **Beverages**: Apple Juice ($2.99)
- **Snacks**: Chocolate Bar ($1.49)  
- **Fruits**: Banana ($0.89)
- **Dairy**: Milk 1L ($3.29)
- **Bakery**: Bread ($2.19)

Each product includes:
- Unique barcode ID
- Name and price
- Category classification
- Detailed description

## Prerequisites

- Node.js (>= 18)
- React Native development environment
- iOS Simulator or Android Emulator
- Physical device with camera for testing barcode scanning

## Installation

1. **Clone and navigate to the project:**
   ```bash
   cd KassaApp
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **iOS Setup:**
   ```bash
   cd ios && pod install && cd ..
   ```

4. **Run the app:**
   
   For iOS:
   ```bash
   npm run ios
   ```
   
   For Android:
   ```bash
   npm run android
   ```

## Usage

1. **Grant Camera Permission:** When first opening the app, grant camera access
2. **Scan Products:** Point the camera at supported barcodes to add items to cart
3. **Manage Cart:** Use + and - buttons to adjust quantities or remove items
4. **Checkout:** Press the checkout button to complete the purchase and reset the cart

## Technical Details

### Built With
- **React Native 0.79.2** - Cross-platform mobile framework
- **TypeScript** - Type-safe JavaScript
- **React Native Vision Camera 4.6.4** - Camera functionality and barcode scanning
- **React Native Reanimated 3.17.5** - Smooth animations

### Architecture
- **Single Screen App** - Optimized for simplicity and kid-friendly use
- **Split Layout** - Camera view on left, shopping cart on right (perfect for iPad)
- **Real-time Scanning** - Continuous barcode detection with debouncing
- **State Management** - React hooks for cart and scanning state
- **Modular Product System** - JSON-based product database with TypeScript service layer

### Key Components
- `App.tsx` - Main application component
- `data/products.json` - Product database with barcode mappings
- `src/productRepository.ts` - Product service layer with search and category features
- Camera integration with built-in code scanner
- Shopping cart with CRUD operations
- Responsive design for tablet use

## Customization

### Adding New Products
Edit the `data/products.json` file:

```json
{
  "metadata": {
    "version": "1.0.0",
    "lastUpdated": "2024-01-15T00:00:00Z",
    "description": "Product database with barcode mappings for Kids Shop Kassa App",
    "totalProducts": 6
  },
  "products": {
    "your-barcode-here": {
      "id": "your-barcode-here",
      "name": "Product Name",
      "price": 4.99,
      "quantity": 1,
      "category": "Category Name",
      "description": "Product description"
    }
  }
}
```

### Using the Product Service
The app includes a robust product service (`src/productRepository.ts`) with methods for:

```typescript
// Get product by barcode
productService.getProductByBarcode('1234567890123');

// Search products
productService.searchProducts('apple');

// Get products by category
productService.getProductsByCategory('Beverages');

// Get all categories
productService.getCategories();
```

### Styling
All styles are defined in the `styles` object at the bottom of `App.tsx`. You can customize:
- Colors and themes
- Button sizes and shapes
- Layout proportions
- Typography

## File Structure

```
├── App.tsx                    # Main application component
├── data/
│   └── products.json         # Product database
├── src/
│   └── productRepository.ts   # Product service layer
├── ios/                      # iOS specific files
├── android/                  # Android specific files
└── package.json             # Dependencies
```

## Permissions

### iOS
- Camera access for barcode scanning

### Android
- Camera permission for barcode scanning
- MLKit barcode scanning model (automatically downloaded)

## Troubleshooting

### Camera Not Working
- Ensure camera permissions are granted
- Check that device has a working camera
- Verify the app is running on a physical device (camera doesn't work in simulators)

### Barcode Not Recognized
- Ensure the barcode is in the supported formats (QR, EAN-13, EAN-8, UPC-A)
- Add the barcode to the `data/products.json` file if it's a custom product
- Check lighting conditions and barcode quality

### Build Issues
- Run `npm install` to ensure all dependencies are installed
- For iOS: `cd ios && pod install`
- Clean build: `npm run clean` (if available) or manually clean in Xcode/Android Studio

## Barcode Label Generator

The app includes a TypeScript script to generate printable PDF labels with barcodes for all products in the database.

### Generate Barcode Labels
```bash
npm run generate-barcodes
```

This will:
- Read all products from `data/products.json`
- Generate CODE128 barcodes for each product ID
- Create a printable PDF with product names, prices, and categories
- Save the PDF in the `output/` directory

### Features
- **A4 format** - Ready for standard printer paper
- **2 labels per row** - Optimized for label sheets
- **Complete product info** - Barcode, name, price, and category
- **Error handling** - Continues processing if individual barcodes fail
- **Configurable layout** - Easily adjust dimensions and spacing

For more details, see `scripts/README.md`.

## Future Enhancements

- 🌐 **API Integration** - Connect to real product database
- 🎵 **Sound Effects** - Add scanning and checkout sounds
- 🏆 **Achievements** - Gamify the shopping experience
- 💳 **Payment Simulation** - Add different payment methods
- 📊 **Shopping History** - Track previous purchases
- 🌍 **Multi-language** - Support for different languages
- 📱 **Product Management UI** - Admin interface for managing products

## Contributing

This is an educational project perfect for learning React Native development. Feel free to:
- Add new features
- Improve the UI/UX
- Add more product categories
- Enhance the scanning experience
- Extend the product service functionality

## License

This project is open source and available under the MIT License.

## Support

For questions or issues, please check the troubleshooting section above or refer to the React Native Vision Camera documentation.

---

**Happy Shopping! 🛒✨**
# kassa_app
