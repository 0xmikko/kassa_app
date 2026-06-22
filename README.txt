KassaApp — a "shop cash register" game for kids
=================================================

A game I built for my kids. The child plays the cashier: scans barcodes
on real or printed-out "products", drops them into a cart, and rings up
the receipt — just like at a real supermarket checkout.

What's inside
-------------
- React Native app for iOS and Android.
- iPad-friendly layout: camera on the left, cart on the right.
- Real-time barcode scanning (QR, EAN-13, EAN-8, UPC-A).
- Products and prices live in a simple JSON file — easy to edit.
- A "beep" sound on each scan, like a real register.
- A script that generates a printable PDF of barcodes so you can
  stick them onto toy groceries.

How to play
-----------
1. Launch the app, grant camera access.
2. Point the camera at a product's barcode — it lands in the cart.
3. Use + / − to change quantity or remove an item.
4. Tap "Checkout" — the cart resets and the next customer can start.

Project layout
--------------
  App.tsx                   — root component
  screens/MainScreen.tsx    — main register screen
  src/productRepository.ts  — product database access
  data/products.json        — products, prices, barcodes
  scripts/                  — PDF barcode generator
  ios/, android/            — native projects

Run it
------
  npm install
  cd ios && pod install && cd ..      # iOS only
  npm run ios                          # or: npm run android

Print barcodes for toy products
-------------------------------
  npm run generate-barcodes
The PDF lands in output/ — print it, cut out the labels, and stick
them onto toy boxes and play food.

Add your own product
--------------------
Open data/products.json and add an entry:

  "4600000000017": {
    "id": "4600000000017",
    "name": "Milk",
    "price": 2.49,
    "quantity": 1,
    "category": "Dairy",
    "description": "1 liter of milk"
  }

Then regenerate the PDF and print the new label.

Requirements
------------
- Node.js >= 18
- Xcode (iOS) / Android Studio (Android)
- A physical device with a camera — the scanner doesn't work in
  simulators.

Author
------
Mikael. A personal project — a game for my own kids.
