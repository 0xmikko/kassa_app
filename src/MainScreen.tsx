import React, {useEffect, useRef, useState} from 'react';
import {
  Alert,
  Animated,
  FlatList,
  Image,
  Modal,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
} from 'react-native-vision-camera';

// Import product service
import {productService} from './productRepository';
import {Product} from './types';

import SoundPlayer from 'react-native-sound-player';

interface CartItem {
  product: Product;
  quantity: number;
}

function MainScreen(): React.JSX.Element {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isActive, setIsActive] = useState(true);
  const [unknownBarcodeScanned, setUnknownBarcodeScanned] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false); // Try image loading again
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);

  // Use ref for immediate tracking to prevent rapid duplicate scans
  const lastScannedRef = useRef<string>('');
  const scanCooldownRef = useRef<boolean>(false);

  const device = useCameraDevice('back');
  const {hasPermission, requestPermission} = useCameraPermission();

  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13', 'ean-8', 'upc-a'],
    onCodeScanned: codes => {
      if (codes.length > 0 && isActive && !scanCooldownRef.current) {
        const barcode = codes[0];
        const scannedCode = barcode.value;

        if (scannedCode) {
          handleBarcodeScanned(scannedCode);
        }
      }
    },
  });

  // Animation for loading dots
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Start pulsing animation when processing modal is shown
  useEffect(() => {
    if (showProcessingModal) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      );
      pulseAnimation.start();

      return () => {
        pulseAnimation.stop();
        fadeAnim.setValue(1);
      };
    }
  }, [showProcessingModal, fadeAnim]);

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  // Keep this useEffect - it helps with image loading
  useEffect(() => {
    try {
      const testImage = require('../assets/images/ah.png');
      console.log('Image require successful:', testImage);
    } catch (error) {
      console.log('Image require failed:', error);
      setImageLoadError(true);
    }
  }, []);

  // Cleanup sounds when component unmounts
  useEffect(() => {
    return () => {
      // systemSoundManager.cleanup().catch(console.log);
    };
  }, []);

  const handleBarcodeScanned = (barcode: string) => {
    // Immediate check using ref to prevent rapid duplicate scans
    if (barcode === lastScannedRef.current || scanCooldownRef.current) {
      return;
    }

    // Set immediate cooldown and track the barcode
    scanCooldownRef.current = true;
    lastScannedRef.current = barcode;

    const product = productService.getProductByBarcode(barcode);

    if (product) {
      // Play success sound using SoundPlayer
      try {
        SoundPlayer.playAsset(require('../assets/sounds/beep.mp3'));
      } catch (e) {
        console.log(`cannot play the success sound file`, e);
      }

      // Clear unknown barcode state if it was set
      setUnknownBarcodeScanned(false);

      setCart(prevCart => {
        const existingItemIndex = prevCart.findIndex(
          item => item.product.id === product.id,
        );

        if (existingItemIndex !== -1) {
          // Update quantity if product already exists
          const updatedCart = [...prevCart];
          updatedCart[existingItemIndex].quantity += 1;
          return updatedCart;
        } else {
          // Add new product to cart
          return [...prevCart, {product, quantity: 1}];
        }
      });

      // Longer pause to prevent rapid scanning of the same item
      setIsActive(false);
      setTimeout(() => {
        setIsActive(true);
        scanCooldownRef.current = false;
        lastScannedRef.current = '';
      }, 2000); // Increased to 2 seconds for successful scans
    } else {
      // Play error sound using SoundPlayer
      try {
        SoundPlayer.playAsset(require('../assets/sounds/error.mp3'));
      } catch (e) {
        console.log(`cannot play the error sound file`, e);
      }

      // Set unknown barcode state instead of showing alert
      setUnknownBarcodeScanned(true);

      // Pause to prevent rapid repeated scans
      setIsActive(false);
      setTimeout(() => {
        setIsActive(true);
        scanCooldownRef.current = false;
        lastScannedRef.current = '';
        setUnknownBarcodeScanned(false);
      }, 3000); // Even longer pause for unknown barcodes
    }
  };

  const getTotalPrice = (): number => {
    return cart.reduce((total, item) => {
      return total + item.product.price * item.quantity;
    }, 0);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      Alert.alert('Empty Cart', 'Please scan some products first!');
      return;
    }

    // Show payment method selection modal
    setShowPaymentModal(true);
  };

  const processPayment = (paymentMethod: 'cash' | 'card') => {
    // Hide payment selection modal first
    setShowPaymentModal(false);

    if (paymentMethod === 'card') {
      // Show processing modal for card payment
      setShowProcessingModal(true);

      // Process for 5 seconds, then complete
      setTimeout(() => {
        setShowProcessingModal(false);
        setCart([]);

        // Play checkout success sound
        console.log('🔊 Playing checkout sound...');
      }, 5000);
    } else {
      // Show cash payment modal
      setShowCashModal(true);
    }
  };

  const completeCashPayment = () => {
    setShowCashModal(false);
    setCart([]);

    // Play checkout success sound
    console.log('🔊 Playing checkout sound...');
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => {
      return prevCart.filter(item => item.product.id !== productId);
    });
  };

  const updateQuantity = (productId: string, change: number) => {
    setCart(prevCart => {
      return prevCart
        .map(item => {
          if (item.product.id === productId) {
            const newQuantity = Math.max(0, item.quantity + change);
            return newQuantity === 0 ? null : {...item, quantity: newQuantity};
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const renderCartItem = ({item}: {item: CartItem}) => (
    <View style={styles.cartItem}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.product.name}</Text>
        <Text style={styles.itemPrice}>
          ${item.product.price.toFixed(2)} each
        </Text>
      </View>
      <View style={styles.quantityContainer}>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => updateQuantity(item.product.id, -1)}>
          <Text style={styles.quantityButtonText}>-</Text>
        </TouchableOpacity>
        <Text style={styles.quantity}>{item.quantity}</Text>
        <TouchableOpacity
          style={styles.quantityButton}
          onPress={() => updateQuantity(item.product.id, 1)}>
          <Text style={styles.quantityButtonText}>+</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.itemTotal}>
        <Text style={styles.itemTotalText}>
          ${(item.product.price * item.quantity).toFixed(2)}
        </Text>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeFromCart(item.product.id)}>
          <Text style={styles.removeButtonText}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.permissionText}>
          Camera permission is required to scan barcodes
        </Text>
      </SafeAreaView>
    );
  }

  if (!device) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.permissionText}>No camera device found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#01AEF2"
        translucent={false}
        hidden={false}
      />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          {!imageLoadError ? (
            <Image
              source={require('../assets/images/ah.png')}
              style={styles.logo}
              resizeMode="contain"
              onError={error => {
                console.log('Image error:', error.nativeEvent.error);
                setImageLoadError(true);
              }}
            />
          ) : (
            <View style={styles.logoFallback}>
              <Text style={styles.logoText}>AH</Text>
            </View>
          )}
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Albert Hein</Text>
            <Text style={styles.headerSubtitle}>
              Scan products to add them to cart
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        {/* Camera Section */}
        <View style={styles.cameraContainer}>
          <Camera
            style={styles.camera}
            device={device}
            isActive={isActive && hasPermission}
            codeScanner={codeScanner}
          />
          <View style={styles.scanOverlay}>
            <View style={styles.scanFrame} />
            <Text
              style={[
                styles.scanText,
                unknownBarcodeScanned && styles.scanTextError,
              ]}>
              {unknownBarcodeScanned
                ? 'Unknown barcode'
                : isActive
                ? 'Point camera at barcode'
                : 'Processing...'}
            </Text>
          </View>
        </View>

        {/* Cart Section */}
        <View style={styles.cartContainer}>
          <View style={styles.cartHeader}>
            <Text style={styles.cartTitle}>
              Shopping Cart ({cart.length} items)
            </Text>
            <Text style={styles.totalAmount}>
              Total: ${getTotalPrice().toFixed(2)}
            </Text>
          </View>

          {cart.length === 0 ? (
            <View style={styles.emptyCart}>
              <Text style={styles.emptyCartText}>🛒</Text>
              <Text style={styles.emptyCartSubtext}>
                Scan products to add them here
              </Text>
            </View>
          ) : (
            <FlatList
              data={cart}
              renderItem={renderCartItem}
              keyExtractor={item => item.product.id}
              style={styles.cartList}
            />
          )}

          <TouchableOpacity
            style={[
              styles.checkoutButton,
              cart.length === 0 && styles.checkoutButtonDisabled,
            ]}
            onPress={handleCheckout}
            disabled={cart.length === 0}>
            <Text style={styles.checkoutButtonText}>
              💳 Checkout - ${getTotalPrice().toFixed(2)}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Payment Method Modal */}
      <Modal
        visible={showPaymentModal}
        transparent={true}
        animationType="fade"
        supportedOrientations={['landscape']}
        onRequestClose={() => setShowPaymentModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Payment Method</Text>
              <Text style={styles.modalSubtitle}>
                Total: ${getTotalPrice().toFixed(2)}
              </Text>
            </View>

            <View style={styles.paymentOptions}>
              <TouchableOpacity
                style={styles.paymentOption}
                onPress={() => processPayment('cash')}>
                <View style={styles.paymentIconContainer}>
                  <Text style={styles.paymentIcon}>💵</Text>
                </View>
                <Text style={styles.paymentOptionText}>Cash</Text>
                <Text style={styles.paymentOptionSubtext}>Pay with cash</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.paymentOption}
                onPress={() => processPayment('card')}>
                <View style={styles.paymentIconContainer}>
                  <Text style={styles.paymentIcon}>💳</Text>
                </View>
                <Text style={styles.paymentOptionText} numberOfLines={1}>
                  Visa/Mastercard
                </Text>
                <Text style={styles.paymentOptionSubtext}>Pay with card</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowPaymentModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Processing Modal */}
      <Modal
        visible={showProcessingModal}
        transparent={true}
        animationType="fade"
        supportedOrientations={['landscape']}>
        <View style={styles.modalOverlay}>
          <View style={styles.processingModalContainer}>
            <Text style={styles.processingIcon}>💳</Text>
            <Text style={styles.processingTitle}>Processing Payment...</Text>
            <Text style={styles.processingSubtitle}>
              Total: ${getTotalPrice().toFixed(2)}
            </Text>
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Please wait</Text>
              <Animated.Text style={[styles.loadingDots, {opacity: fadeAnim}]}>
                ●●●
              </Animated.Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Cash Payment Modal */}
      <Modal
        visible={showCashModal}
        transparent={true}
        animationType="fade"
        supportedOrientations={['landscape']}
        onRequestClose={() => setShowCashModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.cashIcon}>💵</Text>
              <Text style={styles.modalTitle}>Cash Payment</Text>
              <Text style={styles.cashTotal}>
                Total: ${getTotalPrice().toFixed(2)}
              </Text>
            </View>

            <View style={styles.cashButtons}>
              <TouchableOpacity
                style={styles.paidButton}
                onPress={completeCashPayment}>
                <Text style={styles.paidButtonText}>✓ Paid</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowCashModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#01AEF2',
  },
  header: {
    backgroundColor: '#01AEF2',
    padding: 25,
    paddingTop: Platform.OS === 'ios' ? 15 : 25,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerText: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'left',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'left',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    padding: 20,
    gap: 20,
    backgroundColor: '#f5f5f5',
  },
  cameraContainer: {
    flex: 1, // 1/3 width when combined with cartContainer flex: 2
    position: 'relative',
    borderRadius: 15,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  camera: {
    flex: 1,
  },
  scanOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: '#4CAF50',
    backgroundColor: 'transparent',
    borderRadius: 15,
  },
  scanText: {
    marginTop: 25,
    fontSize: 18,
    color: 'white',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 12,
    borderRadius: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  scanTextError: {
    backgroundColor: '#f44336',
  },
  cartContainer: {
    flex: 2, // 2/3 width - cart section
    backgroundColor: 'white',
    borderRadius: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  cartHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#01AEF2',
  },
  cartList: {
    flex: 1,
    padding: 12,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginVertical: 6,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  itemInfo: {
    flex: 2,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  itemPrice: {
    fontSize: 14,
    color: '#666',
    marginTop: 3,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#01AEF2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  quantity: {
    marginHorizontal: 16,
    fontSize: 16,
    fontWeight: 'bold',
    minWidth: 25,
    textAlign: 'center',
  },
  itemTotal: {
    flex: 1,
    alignItems: 'flex-end',
  },
  itemTotalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#01AEF2',
  },
  removeButton: {
    marginTop: 6,
    padding: 6,
  },
  removeButtonText: {
    color: '#f44336',
    fontSize: 12,
    fontWeight: '500',
  },
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyCartText: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyCartSubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  checkoutButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    margin: 20,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  checkoutButtonDisabled: {
    backgroundColor: '#ccc',
  },
  checkoutButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  permissionText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 60,
    color: '#666',
    padding: 30,
  },
  logoFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#01AEF2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  logo: {
    width: 60,
    height: 60,
    marginRight: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 20,
    width: '85%',
    maxWidth: 400,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 18,
    color: '#01AEF2',
    fontWeight: '600',
  },
  paymentOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    gap: 15,
  },
  paymentOption: {
    flex: 1,
    padding: 20,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 15,
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  paymentIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#01AEF2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  paymentIcon: {
    fontSize: 30,
  },
  paymentOptionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
    textAlign: 'center',
  },
  paymentOptionSubtext: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#f44336',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  modalCancelText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  processingModalContainer: {
    backgroundColor: 'white',
    padding: 40,
    borderRadius: 20,
    width: '85%',
    maxWidth: 400,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.25,
    shadowRadius: 10,
    alignItems: 'center',
  },
  processingIcon: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 20,
  },
  processingTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  processingSubtitle: {
    fontSize: 18,
    color: '#01AEF2',
    fontWeight: '600',
    marginBottom: 30,
    textAlign: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  loadingDots: {
    fontSize: 16,
    color: '#666',
    marginLeft: 5,
    textAlign: 'center',
  },
  cashIcon: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 10,
  },
  cashTotal: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#01AEF2',
    textAlign: 'center',
  },
  cashButtons: {
    marginTop: 30,
    gap: 15,
  },
  paidButton: {
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.2,
    shadowRadius: 6,
    marginBottom: 10,
  },
  paidButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default MainScreen;
