import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, Star, Plus, X, Phone, 
  CreditCard, QrCode, Truck, ArrowRight 
} from 'lucide-react';
import supabase from './lib/supabase';

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  image: string;
  description: string;
  rating: number;
  discount: number;
  is_bestseller: boolean;
  is_new: boolean;
}

interface CartItem {
  product: Product;
  quantity: number;
  size: string;
}

const sizes = ['S', 'M', 'L', 'XL'];

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedSize, setSelectedSize] = useState('M');
  const [quantity, setQuantity] = useState(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isSuccessOpen, setIsSuccessOpen] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({
    name: '',
    phone: '',
    address: ''
  });
  const [timeLeft, setTimeLeft] = useState({ hours: 23, minutes: 45, seconds: 12 });
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Fake hero images (use the generated one and picsum)
  const heroImages = [
    '/images/hero.jpg',
    'https://picsum.photos/id/1015/2000/1200',
    'https://picsum.photos/id/1027/2000/1200'
  ];

  // Fetch products from Supabase
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Convert price and rating to numbers
      const formattedData = (data || []).map(p => ({
        ...p,
        price: parseFloat(p.price as any),
        rating: parseFloat(p.rating as any)
      }));
      
      setProducts(formattedData);
      setFilteredProducts(formattedData);
    } catch (err) {
      console.error('Error fetching products:', err);
      // Fallback data if needed but since we have DB, keep empty
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    
    // Load cart from localStorage
    const savedCart = localStorage.getItem('idOlshopCart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('idOlshopCart', JSON.stringify(cart));
  }, [cart]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { hours, minutes, seconds } = prev;
        
        seconds--;
        if (seconds < 0) {
          seconds = 59;
          minutes--;
          if (minutes < 0) {
            minutes = 59;
            hours--;
            if (hours < 0) {
              hours = 23;
            }
          }
        }
        
        return { hours, minutes, seconds };
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // Filter and sort products
  useEffect(() => {
    let result = [...products];
    
    // Category filter
    if (activeCategory !== 'All') {
      result = result.filter(p => p.category === activeCategory);
    }
    
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(term) || 
        p.description.toLowerCase().includes(term)
      );
    }
    
    // Sort
    if (sortBy === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else {
      // popular: bestsellers first
      result.sort((a, b) => {
        if (a.is_bestseller && !b.is_bestseller) return -1;
        if (!a.is_bestseller && b.is_bestseller) return 1;
        return b.rating - a.rating;
      });
    }
    
    setFilteredProducts(result);
  }, [products, activeCategory, searchTerm, sortBy]);

  const addToCart = (product: Product, size: string, qty: number) => {
    const existingItem = cart.findIndex(
      item => item.product.id === product.id && item.size === size
    );
    
    if (existingItem !== -1) {
      const updatedCart = [...cart];
      updatedCart[existingItem].quantity += qty;
      setCart(updatedCart);
    } else {
      setCart([...cart, { product, quantity: qty, size }]);
    }
    
    setIsCartOpen(true);
    setSelectedProduct(null);
    setQuantity(1);
  };

  const removeFromCart = (index: number) => {
    const updatedCart = cart.filter((_, i) => i !== index);
    setCart(updatedCart);
  };

  const updateCartQuantity = (index: number, newQty: number) => {
    if (newQty < 1) return;
    const updatedCart = [...cart];
    updatedCart[index].quantity = newQty;
    setCart(updatedCart);
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => {
      const itemPrice = item.product.discount 
        ? item.product.price * (1 - item.product.discount / 100) 
        : item.product.price;
      return total + itemPrice * item.quantity;
    }, 0);
  };

  const getCartCount = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const handleCheckout = () => {
    setIsCartOpen(false);
    setIsCheckoutOpen(true);
  };

  const handleWhatsAppOrder = () => {
    if (!checkoutForm.name || !checkoutForm.phone) {
      alert("Please fill name and phone number");
      return;
    }
    
    const total = getTotalPrice().toFixed(2);
    let message = `Halo, saya ingin order produk berikut dari ID OLSHOP:%0A%0A`;
    message += `Nama: ${checkoutForm.name}%0A`;
    message += `No. HP: ${checkoutForm.phone}%0A`;
    message += `Alamat: ${checkoutForm.address}%0A%0A`;
    
    cart.forEach((item, idx) => {
      const price = item.product.discount 
        ? (item.product.price * (1 - item.product.discount / 100)).toFixed(0) 
        : item.product.price.toFixed(0);
      message += `${idx+1}. ${item.product.name} (${item.size}) x${item.quantity} = Rp${(parseFloat(price) * item.quantity).toFixed(0)}%0A`;
    });
    
    message += `%0ATotal: Rp${total}%0A%0ATerima kasih!`;
    
    const whatsappUrl = `https://wa.me/6281234567890?text=${message}`;
    window.open(whatsappUrl, '_blank');
    
    setIsCheckoutOpen(false);
    setCart([]);
    setCheckoutForm({ name: '', phone: '', address: '' });
  };

  const simulatePayment = () => {
    if (!checkoutForm.name || !checkoutForm.phone || !checkoutForm.address) {
      alert("Please complete all fields");
      return;
    }
    setIsCheckoutOpen(false);
    setIsPaymentOpen(true);
  };

  const completePayment = () => {
    setIsPaymentOpen(false);
    setTimeout(() => {
      setIsSuccessOpen(true);
      setCart([]);
      setCheckoutForm({ name: '', phone: '', address: '' });
    }, 1500);
  };

  const categories = ['All', 'Men', 'Women', 'Accessories'];

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', { 
      style: 'currency', 
      currency: 'IDR',
      minimumFractionDigits: 0 
    }).format(price);
  };

  const discountedPrice = (product: Product) => {
    if (!product.discount) return product.price;
    return product.price * (1 - product.discount / 100);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans overflow-x-hidden">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-50 bg-black/90 backdrop-blur-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-[#ff2e9f] to-[#00eaff] rounded-xl flex items-center justify-center">
              <span className="text-black text-2xl font-bold tracking-tighter">IO</span>
            </div>
            <div>
              <div className="text-3xl font-semibold tracking-tighter">ID OLSHOP</div>
              <div className="text-[10px] text-white/40 -mt-1">EST 2023</div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm uppercase tracking-widest">
            <a href="#home" className="hover:text-[#ff2e9f] transition-colors">Home</a>
            <a href="#shop" className="hover:text-[#ff2e9f] transition-colors">Shop</a>
            <a href="#bestsellers" className="hover:text-[#ff2e9f] transition-colors">Best Sellers</a>
            <a href="#new" className="hover:text-[#ff2e9f] transition-colors">New Arrivals</a>
          </div>

          <div className="flex items-center gap-6">
            <div 
              onClick={() => setIsCartOpen(true)}
              className="relative cursor-pointer group"
            >
              <div className="p-3 hover:bg-white/5 rounded-full transition-all">
                <ShoppingCart className="w-5 h-5 group-hover:text-[#ff2e9f]" />
              </div>
              {getCartCount() > 0 && (
                <div className="absolute -top-1 -right-1 bg-[#ff2e9f] text-[10px] font-mono w-5 h-5 flex items-center justify-center rounded-full">
                  {getCartCount()}
                </div>
              )}
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="px-6 py-2.5 bg-white text-black rounded-full text-sm font-medium flex items-center gap-2 hover:bg-[#ff2e9f] hover:text-white transition-all"
            >
              SHOP NOW
            </motion.button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section id="home" className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff10_1px,transparent_1px)] bg-[length:60px_60px]"></div>
        
        <AnimatePresence mode="wait">
          <motion.div 
            key={currentImageIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            className="absolute inset-0 bg-cover bg-center"
            style={{ 
              backgroundImage: `linear-gradient(rgba(10,10,10,0.45), rgba(10,10,10,0.65)), url(${heroImages[currentImageIndex]})` 
            }}
          />
        </AnimatePresence>

        <div className="relative z-10 max-w-4xl mx-auto text-center px-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-5 py-1.5 bg-white/10 backdrop-blur rounded-3xl text-xs tracking-[3px] mb-6 border border-white/20">
              NEW SEASON COLLECTION
            </div>
            
            <h1 className="text-7xl md:text-[92px] font-semibold tracking-tighter leading-none mb-4">
              ELEVATE<br />YOUR STYLE
            </h1>
            
            <p className="max-w-md mx-auto text-xl text-white/70 mb-12">
              Premium streetwear and contemporary fashion for the modern individual
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button 
                onClick={() => document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' })}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-10 py-4 bg-white text-black rounded-2xl flex items-center justify-center gap-3 text-lg font-medium group"
              >
                SHOP COLLECTION
                <ArrowRight className="group-hover:translate-x-1 transition" />
              </motion.button>
              
              <motion.button 
                onClick={() => setIsCartOpen(true)}
                whileHover={{ scale: 1.03 }}
                className="px-10 py-4 border border-white/40 hover:bg-white/5 rounded-2xl text-lg font-medium transition"
              >
                VIEW CART
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Carousel dots */}
        <div className="absolute bottom-12 left-1/2 flex gap-3 z-20">
          {heroImages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentImageIndex(idx)}
              className={`w-2 h-2 rounded-full transition-all ${currentImageIndex === idx ? 'bg-white w-8' : 'bg-white/40'}`}
            />
          ))}
        </div>

        <div className="absolute bottom-8 left-1/2 flex flex-col items-center text-xs tracking-widest opacity-60">
          SCROLL TO DISCOVER
          <div className="w-px h-8 bg-white/40 mt-3"></div>
        </div>
      </section>

      {/* PROMO MARQUEE */}
      <div className="bg-[#ff2e9f] py-3 overflow-hidden">
        <div className="flex whitespace-nowrap animate-marquee">
          <div className="flex items-center gap-12 text-black font-medium text-sm">
            {Array.from({ length: 6 }).map((_, i) => (
              <span key={i} className="flex items-center gap-8">
                SALE UP TO 50% OFF • FREE SHIPPING ON ORDERS OVER RP500K • 
                LIMITED TIME ONLY
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* FLASH SALE */}
      <div id="bestsellers" className="max-w-7xl mx-auto px-6 pt-16 pb-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <div className="uppercase tracking-[2px] text-[#ff2e9f] text-sm font-medium">DON&apos;T MISS OUT</div>
            <h2 className="text-5xl font-semibold tracking-tighter">FLASH SALE</h2>
          </div>
          
          <div className="flex items-center gap-3 text-sm font-mono bg-black border border-white/10 px-6 py-3 rounded-2xl">
            <div className="text-[#ff2e9f]">ENDS IN</div>
            <div className="flex gap-3 tabular-nums">
              <span className="bg-white/5 px-3 py-1 rounded-xl">{timeLeft.hours.toString().padStart(2, '0')}</span>
              <span>:</span>
              <span className="bg-white/5 px-3 py-1 rounded-xl">{timeLeft.minutes.toString().padStart(2, '0')}</span>
              <span>:</span>
              <span className="bg-white/5 px-3 py-1 rounded-xl">{timeLeft.seconds.toString().padStart(2, '0')}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {products.filter(p => p.is_bestseller).slice(0, 4).map((product) => (
            <motion.div
              key={product.id}
              whileHover={{ y: -8 }}
              onClick={() => {
                setSelectedProduct(product);
                setSelectedSize('M');
                setQuantity(1);
              }}
              className="group bg-zinc-950 rounded-3xl overflow-hidden cursor-pointer border border-white/5 hover:border-[#ff2e9f]/30 transition-all"
            >
              <div className="relative">
                <img 
                  src={product.image} 
                  alt={product.name}
                  className="w-full h-64 object-cover transition-transform group-hover:scale-110 duration-700" 
                />
                {product.discount > 0 && (
                  <div className="absolute top-4 right-4 bg-[#ff2e9f] text-black text-xs px-3 py-1 rounded-2xl font-medium">
                    -{product.discount}%
                  </div>
                )}
                <div className="absolute bottom-4 left-4 bg-black/70 text-xs px-3 py-1 rounded-2xl flex items-center gap-1">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> {product.rating}
                </div>
              </div>
              <div className="p-5">
                <div className="font-medium text-lg leading-none mb-2 line-clamp-2">{product.name}</div>
                <div className="flex justify-between items-baseline">
                  <div>
                    <span className="text-[#00eaff] font-mono text-xl">
                      {formatPrice(discountedPrice(product))}
                    </span>
                    {product.discount > 0 && (
                      <span className="line-through text-xs text-white/40 ml-2">
                        {formatPrice(product.price)}
                      </span>
                    )}
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(product, 'M', 1);
                    }}
                    className="text-xs bg-white/10 hover:bg-white hover:text-black px-4 py-2 rounded-2xl transition-all"
                  >
                    ADD
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* SHOP SECTION */}
      <section id="shop" className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
          <div>
            <div className="text-xs uppercase text-[#00eaff] tracking-widest mb-1">DISCOVER</div>
            <h2 className="text-5xl font-semibold tracking-[-2px]">Our Collection</h2>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 mt-8 md:mt-0">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-zinc-900 border border-white/10 focus:border-[#ff2e9f] rounded-3xl px-6 py-3 w-full md:w-72 outline-none text-sm"
            />
            
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-zinc-900 border border-white/10 rounded-3xl px-6 py-3 text-sm outline-none"
            >
              <option value="popular">Sort: Popular</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Best Rated</option>
            </select>
          </div>
        </div>

        {/* CATEGORY FILTERS */}
        <div className="flex gap-3 mb-10 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-8 py-2.5 text-sm rounded-3xl transition-all border ${activeCategory === cat 
                ? 'bg-white text-black border-white' 
                : 'border-white/10 hover:border-white/40'}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin h-8 w-8 border-2 border-[#ff2e9f] border-t-transparent rounded-full"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            <AnimatePresence>
              {filteredProducts.map((product) => {
                const discPrice = discountedPrice(product);
                return (
                  <motion.div 
                    key={product.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    whileHover={{ y: -12 }}
                    className="group bg-zinc-950 rounded-3xl overflow-hidden cursor-pointer border border-white/5 hover:border-[#ff2e9f]/40"
                    onClick={() => {
                      setSelectedProduct(product);
                      setSelectedSize('M');
                      setQuantity(1);
                      setCurrentImageIndex(0);
                    }}
                  >
                    <div className="relative aspect-[4/3.35] overflow-hidden">
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                      />
                      
                      {(product.is_new || product.is_bestseller) && (
                        <div className="absolute top-5 left-5 bg-black/80 text-white text-[10px] px-4 py-1 rounded-3xl tracking-wider">
                          {product.is_new ? 'NEW' : 'BEST'}
                        </div>
                      )}
                      
                      {product.discount > 0 && (
                        <div className="absolute top-5 right-5 text-xs bg-[#ff2e9f] text-black px-3 py-1 font-semibold rounded-3xl">
                          {product.discount}% OFF
                        </div>
                      )}
                    </div>
                    
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <div className="font-medium pr-2 leading-tight text-[17px]">{product.name}</div>
                        <div className="flex items-center gap-px text-amber-400 text-sm">
                          ★ <span className="text-white/70 text-xs ml-1">{product.rating}</span>
                        </div>
                      </div>
                      
                      <div className="text-sm text-white/60 line-clamp-2 mb-4 h-10">
                        {product.description}
                      </div>
                      
                      <div className="flex justify-between items-end">
                        <div>
                          <div className="font-mono text-2xl text-[#00eaff] tracking-tighter">
                            {formatPrice(discPrice)}
                          </div>
                          {product.discount > 0 && (
                            <div className="text-xs text-white/30 line-through">
                              {formatPrice(product.price)}
                            </div>
                          )}
                        </div>
                        
                        <motion.button 
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart(product, 'M', 1);
                          }}
                          className="bg-white hover:bg-[#ff2e9f] hover:text-white transition-all text-black w-10 h-10 flex items-center justify-center rounded-2xl"
                        >
                          <Plus className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {filteredProducts.length === 0 && !loading && (
          <div className="text-center py-20 text-white/40">
            No products found. Try different filters.
          </div>
        )}
      </section>

      {/* NEW ARRIVALS */}
      <section id="new" className="bg-zinc-950 py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-baseline mb-12">
            <div>
              <div className="text-[#00eaff] text-xs tracking-widest mb-2">FRESH DROPS</div>
              <h3 className="text-5xl font-semibold tracking-tight">New Arrivals</h3>
            </div>
            <a href="#shop" className="text-sm flex items-center gap-2 group">
              BROWSE ALL 
              <div className="group-hover:translate-x-1 transition">→</div>
            </a>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
            {products.filter(p => p.is_new).slice(0, 5).map(product => (
              <div 
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className="bg-[#111] group rounded-3xl overflow-hidden cursor-pointer"
              >
                <div className="relative h-72">
                  <img src={product.image} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.08] transition-transform duration-500" />
                </div>
                <div className="px-6 py-6">
                  <div className="text-sm opacity-60 mb-1">{product.category}</div>
                  <div className="font-medium">{product.name}</div>
                  <div className="mt-4 text-[#00eaff] font-light">{formatPrice(product.price)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-black border-t border-white/10 pt-16 pb-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-y-14">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-cyan-400 rounded-2xl flex items-center justify-center">
                <span className="font-black text-black text-3xl">I</span>
              </div>
              <div className="text-4xl font-semibold tracking-tighter">IDOLSHOP</div>
            </div>
            <p className="text-sm text-white/50 max-w-[210px]">
              Curating the finest modern fashion from around the globe.
            </p>
            
            <div className="mt-8 flex gap-5">
              <div className="w-8 h-8 rounded-2xl bg-white/5 flex items-center justify-center">𝕏</div>
              <div className="w-8 h-8 rounded-2xl bg-white/5 flex items-center justify-center">📸</div>
            </div>
          </div>
          
          <div>
            <div className="uppercase text-xs tracking-widest mb-6 text-white/50">SHOP</div>
            <div className="space-y-3 text-sm">
              {['New Arrivals', 'Best Sellers', 'Sale', 'Men', 'Women'].map(l => (
                <div key={l} className="cursor-pointer hover:text-[#ff2e9f]">{l}</div>
              ))}
            </div>
          </div>
          
          <div>
            <div className="uppercase text-xs tracking-widest mb-6 text-white/50">SUPPORT</div>
            <div className="space-y-3 text-sm">
              {['Contact Us', 'Shipping', 'Returns', 'Size Guide', 'FAQ'].map(l => (
                <div key={l} className="cursor-pointer hover:text-[#ff2e9f]">{l}</div>
              ))}
            </div>
          </div>
          
          <div>
            <div className="uppercase text-xs tracking-widest mb-6 text-white/50">NEWSLETTER</div>
            <div className="text-sm text-white/70 mb-4">Stay up to date with drops and exclusive offers.</div>
            
            <div className="flex">
              <input type="text" placeholder="YOUR EMAIL" className="bg-transparent border border-white/20 text-sm px-5 py-3.5 flex-1 rounded-l-3xl focus:outline-none" />
              <button className="bg-white text-black px-8 rounded-r-3xl text-xs font-medium">JOIN</button>
            </div>
            
            <div className="mt-12 text-xs text-white/30">© {new Date().getFullYear()} ID OLSHOP. ALL RIGHTS RESERVED.</div>
          </div>
        </div>
      </footer>

      {/* PRODUCT DETAIL MODAL */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4" onClick={() => setSelectedProduct(null)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="bg-zinc-900 rounded-3xl max-w-4xl w-full overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex flex-col lg:flex-row">
                {/* IMAGE */}
                <div className="lg:w-1/2 bg-black relative">
                  <img 
                    src={selectedProduct.image} 
                    alt={selectedProduct.name} 
                    className="w-full h-full object-cover min-h-[420px] lg:min-h-[560px]"
                  />
                  {selectedProduct.discount > 0 && (
                    <div className="absolute top-8 left-8 px-5 py-2 bg-white text-xs text-black font-bold rounded-3xl">
                      {selectedProduct.discount}% OFF
                    </div>
                  )}
                </div>
                
                {/* DETAILS */}
                <div className="lg:w-1/2 p-9 lg:p-12 flex flex-col">
                  <button 
                    onClick={() => setSelectedProduct(null)}
                    className="absolute top-8 right-8 text-white/60 hover:text-white"
                  >
                    <X size={22} />
                  </button>
                  
                  <div className="uppercase text-xs tracking-widest text-[#ff2e9f] mb-1">{selectedProduct.category.toUpperCase()}</div>
                  <h3 className="text-4xl font-semibold tracking-tight mb-2">{selectedProduct.name}</h3>
                  
                  <div className="flex items-center gap-3 mb-8">
                    <div className="flex text-amber-400">{'★'.repeat(Math.floor(selectedProduct.rating))}</div>
                    <span className="text-sm text-white/60">{selectedProduct.rating} • 124 reviews</span>
                  </div>
                  
                  <div className="flex items-baseline gap-3 mb-8">
                    <span className="text-5xl font-light text-[#00eaff]">
                      {formatPrice(discountedPrice(selectedProduct))}
                    </span>
                    {selectedProduct.discount > 0 && (
                      <span className="text-xl text-white/30 line-through">
                        {formatPrice(selectedProduct.price)}
                      </span>
                    )}
                  </div>
                  
                  <p className="text-white/70 leading-relaxed mb-8 text-[15px]">
                    {selectedProduct.description} Premium materials and attention to detail define this piece. Made for those who appreciate quality and timeless style.
                  </p>
                  
                  {/* SIZE SELECTOR */}
                  <div className="mb-8">
                    <div className="flex justify-between text-sm mb-3">
                      <div>SIZE</div>
                      <div className="text-[#00eaff] text-xs cursor-pointer hover:underline">SIZE GUIDE</div>
                    </div>
                    <div className="flex gap-3">
                      {sizes.map(size => (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`flex-1 py-4 border rounded-2xl text-sm transition-all ${selectedSize === size 
                            ? 'border-[#ff2e9f] bg-[#ff2e9f]/10' 
                            : 'border-white/20 hover:border-white/60'}`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* QUANTITY */}
                  <div className="mb-8">
                    <div className="text-sm mb-3">QUANTITY</div>
                    <div className="flex border border-white/10 rounded-3xl w-fit">
                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-6 py-4 hover:bg-white/5 rounded-l-3xl">-</button>
                      <div className="px-8 py-4 font-mono border-x border-white/10">{quantity}</div>
                      <button onClick={() => setQuantity(quantity + 1)} className="px-6 py-4 hover:bg-white/5 rounded-r-3xl">+</button>
                    </div>
                  </div>
                  
                  <div className="mt-auto flex flex-col gap-4">
                    <button 
                      onClick={() => addToCart(selectedProduct, selectedSize, quantity)}
                      className="w-full py-5 bg-white text-black rounded-3xl font-medium flex items-center justify-center gap-3 hover:bg-[#ff2e9f] hover:text-white active:scale-[0.985] transition-all"
                    >
                      ADD TO CART — {formatPrice(discountedPrice(selectedProduct) * quantity)}
                    </button>
                    
                    <button 
                      onClick={() => {
                        setSelectedProduct(null);
                        setIsCartOpen(true);
                      }}
                      className="w-full py-5 border border-white/30 rounded-3xl text-sm tracking-widest hover:bg-white/5"
                    >
                      VIEW CART
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CART DRAWER */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 bg-black/70 z-[110] flex justify-end" onClick={() => setIsCartOpen(false)}>
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", bounce: 0.05, duration: 0.4 }}
              className="bg-zinc-950 w-full max-w-md h-full overflow-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <ShoppingCart className="w-6 h-6" />
                    <div className="text-3xl font-medium tracking-tight">Your Cart</div>
                  </div>
                  <button onClick={() => setIsCartOpen(false)}><X /></button>
                </div>
                
                {cart.length > 0 ? (
                  <>
                    <div className="space-y-8">
                      {cart.map((item, index) => (
                        <div key={index} className="flex gap-5">
                          <div className="w-24 h-24 bg-zinc-800 rounded-2xl overflow-hidden flex-shrink-0">
                            <img src={item.product.image} className="w-full h-full object-cover" alt="" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="font-medium leading-tight mb-1">{item.product.name}</div>
                            <div className="text-xs text-white/50">Size: {item.size} • Qty: {item.quantity}</div>
                            
                            <div className="mt-auto pt-4 flex justify-between items-end">
                              <div className="font-mono">
                                {formatPrice(
                                  (item.product.discount ? item.product.price * (1 - item.product.discount/100) : item.product.price) * item.quantity
                                )}
                              </div>
                              
                              <div className="flex items-center gap-4">
                                <button 
                                  onClick={() => updateCartQuantity(index, item.quantity - 1)}
                                  className="text-white/40 hover:text-white"
                                >−</button>
                                <button 
                                  onClick={() => updateCartQuantity(index, item.quantity + 1)}
                                  className="text-white/40 hover:text-white"
                                >+</button>
                                <button 
                                  onClick={() => removeFromCart(index)}
                                  className="text-red-400/70 hover:text-red-400 text-xs"
                                >
                                  REMOVE
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="border-t border-white/10 mt-10 pt-8">
                      <div className="flex justify-between text-sm mb-2">
                        <div>SUBTOTAL</div>
                        <div className="font-medium">{formatPrice(getTotalPrice())}</div>
                      </div>
                      <div className="flex justify-between text-xs text-white/40">
                        <div>SHIPPING</div>
                        <div>FREE</div>
                      </div>
                    </div>
                    
                    <div onClick={handleCheckout} className="mt-8 py-5 bg-white text-black flex items-center justify-center gap-2 rounded-3xl font-medium cursor-pointer active:scale-95 transition">
                      PROCEED TO CHECKOUT
                      <ArrowRight size={18} />
                    </div>
                    
                    <div className="text-center text-xs mt-6 text-white/40">or continue shopping</div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[400px] text-center">
                    <div className="text-6xl mb-6 opacity-20">🛍️</div>
                    <div className="text-xl font-light">Your cart is empty</div>
                    <button 
                      onClick={() => setIsCartOpen(false)}
                      className="mt-8 text-sm border border-white/30 px-8 py-3 rounded-3xl"
                    >
                      BROWSE COLLECTION
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CHECKOUT MODAL */}
      <AnimatePresence>
        {isCheckoutOpen && (
          <div className="fixed inset-0 z-[120] bg-black/90 flex items-center justify-center p-4" onClick={() => setIsCheckoutOpen(false)}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-zinc-900 w-full max-w-lg rounded-3xl p-8"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between mb-8">
                <div className="text-3xl font-medium">Checkout</div>
                <button onClick={() => setIsCheckoutOpen(false)} className="text-white/40"><X size={28} /></button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-xs tracking-widest mb-2 text-white/70">FULL NAME</label>
                  <input 
                    type="text" 
                    value={checkoutForm.name}
                    onChange={(e) => setCheckoutForm({...checkoutForm, name: e.target.value})}
                    className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 outline-none focus:border-white/40" 
                    placeholder="John Doe" 
                  />
                </div>
                
                <div>
                  <label className="block text-xs tracking-widest mb-2 text-white/70">PHONE NUMBER</label>
                  <div className="flex">
                    <div className="bg-black border border-r-0 border-white/10 px-5 flex items-center text-white/40 rounded-l-2xl">+62</div>
                    <input 
                      type="tel" 
                      value={checkoutForm.phone}
                      onChange={(e) => setCheckoutForm({...checkoutForm, phone: e.target.value})}
                      className="flex-1 bg-black border border-white/10 rounded-r-2xl px-5 py-4 outline-none focus:border-white/40" 
                      placeholder="812 3456 7890" 
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs tracking-widest mb-2 text-white/70">DELIVERY ADDRESS</label>
                  <textarea 
                    value={checkoutForm.address}
                    onChange={(e) => setCheckoutForm({...checkoutForm, address: e.target.value})}
                    className="w-full bg-black border border-white/10 rounded-3xl px-5 py-4 outline-none focus:border-white/40 h-24 resize-y" 
                    placeholder="Jl. Sudirman No. 45, Jakarta Selatan..."
                  />
                </div>
              </div>
              
              <div className="my-10 pt-8 border-t border-white/10">
                <div className="flex justify-between mb-3 text-sm">
                  <span className="text-white/70">ORDER TOTAL</span>
                  <span className="font-medium text-xl">{formatPrice(getTotalPrice())}</span>
                </div>
                <div className="text-[10px] text-white/40">Including taxes • Free shipping</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={simulatePayment}
                  className="py-4 rounded-3xl bg-white text-black font-medium flex items-center justify-center gap-2 hover:bg-[#00eaff] hover:text-black transition"
                >
                  <CreditCard className="w-4 h-4" />
                  PAY NOW
                </button>
                
                <button 
                  onClick={handleWhatsAppOrder}
                  className="py-4 rounded-3xl border border-white/30 flex items-center justify-center gap-2 hover:bg-white/5 transition"
                >
                  <Phone className="w-4 h-4" />
                  WHATSAPP
                </button>
              </div>
              
              <div className="text-center text-[10px] mt-8 text-white/30">SECURE CHECKOUT POWERED BY MIDTRANS</div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PAYMENT MODAL */}
      <AnimatePresence>
        {isPaymentOpen && (
          <div className="fixed inset-0 bg-black/95 z-[130] flex items-center justify-center p-6" onClick={() => setIsPaymentOpen(false)}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="max-w-md w-full bg-zinc-900 rounded-3xl p-8 text-center"
              onClick={e => e.stopPropagation()}
            >
              <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
                <CreditCard className="w-8 h-8 text-emerald-400" />
              </div>
              
              <div className="text-2xl font-medium mb-2">Complete your payment</div>
              <div className="text-white/60 text-sm mb-10">Total: <span className="font-mono text-white">{formatPrice(getTotalPrice())}</span></div>
              
              <div className="space-y-3 text-left">
                {[
                  { icon: <QrCode className="w-5 h-5" />, label: "QRIS", time: "Instant" },
                  { icon: <Truck className="w-5 h-5" />, label: "Bank Transfer", time: "Instant confirmation" },
                  { icon: <CreditCard className="w-5 h-5" />, label: "E-Wallets (Gopay, OVO, DANA)", time: "Instant" }
                ].map((method, index) => (
                  <div 
                    key={index}
                    onClick={completePayment}
                    className="flex items-center gap-5 border border-white/10 hover:border-white/40 px-6 py-5 rounded-3xl cursor-pointer group"
                  >
                    <div className="text-[#00eaff]">{method.icon}</div>
                    <div className="flex-1">
                      <div>{method.label}</div>
                      <div className="text-xs text-white/40">{method.time}</div>
                    </div>
                    <div className="text-xs px-4 py-1 bg-white/10 group-hover:bg-white/20 rounded-3xl">SELECT</div>
                  </div>
                ))}
              </div>
              
              <div className="text-xs text-white/30 mt-8">Your payment information is safe and secure</div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SUCCESS MODAL */}
      <AnimatePresence>
        {isSuccessOpen && (
          <div className="fixed inset-0 bg-black/95 z-[140] flex items-center justify-center" onClick={() => setIsSuccessOpen(false)}>
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              className="text-center max-w-xs"
            >
              <div className="mx-auto mb-6 w-24 h-24 rounded-full border-4 border-[#00eaff] flex items-center justify-center">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.6 }}
                >
                  ✅
                </motion.div>
              </div>
              
              <div className="text-4xl font-medium tracking-tight mb-3">THANK YOU!</div>
              <div className="text-white/60">Your order has been placed successfully.</div>
              
              <div className="mt-8 text-xs text-white/30">A confirmation has been sent to your WhatsApp.</div>
              
              <button 
                onClick={() => setIsSuccessOpen(false)}
                className="mt-12 w-full py-4 border border-white/30 rounded-3xl text-sm"
              >
                BACK TO SHOP
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FLOATING WHATSAPP */}
      <motion.a 
        href="https://wa.me/6281234567890"
        target="_blank"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-8 right-8 z-50 bg-[#25D366] text-black w-14 h-14 rounded-full flex items-center justify-center shadow-2xl shadow-[#25D366]/40"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" fill="currentColor" viewBox="0 0 16 16">
          <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.068 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.18-1.098a7.933 7.933 0 0 0 3.81.965c4.367 0 7.926-3.558 7.926-7.926 0-2.12-.83-4.112-2.315-5.615zM7.994 14.37a6.48 6.48 0 0 1-3.28-.887l-.235-.14-2.43.637.65-2.38-.153-.243a6.45 6.45 0 0 1-.998-3.44c0-3.577 2.91-6.487 6.487-6.487 1.73 0 3.356.677 4.575 1.9a6.44 6.44 0 0 1 1.9 4.575c0 3.578-2.91 6.488-6.487 6.488z"/>
        </svg>
      </motion.a>
    </div>
  );
}

export default App;

