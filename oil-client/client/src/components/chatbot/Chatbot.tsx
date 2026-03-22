import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { oliGetJson, oliUrl } from '@/lib/oliApi';
import { 
  MessageCircle, 
  X, 
  Send, 
  Bot, 
  User, 
  Phone, 
  Mail, 
  ShoppingCart,
  Package,
  Truck,
  HelpCircle,
  Clock,
  Star,
  Loader2
} from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type?: 'text' | 'product' | 'order' | 'whatsapp';
  metadata?: any;
}

interface ProductDto {
  id: number;
  categoryId: number | null;
  subCategoryId: number | null;
  name: string;
  slug: string;
  shortDescription: string | null;
  description: string | null;
  price: number;
  originalPrice: number | null;
  rating: number | null;
  reviewCount: number | null;
  size: string | null;
  saleOffer: string | null;
  tagsCsv: string | null;
  inStock: boolean;
  featured: boolean;
  bestseller: boolean;
  newLaunch: boolean;
  imageUrl: string | null;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userPhone, setUserPhone] = useState('');
  const [userName, setUserName] = useState('');
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch products from database
  const fetchProducts = async (query?: string, categoryId?: number): Promise<ProductDto[]> => {
    try {
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (categoryId) params.append('categoryId', categoryId.toString());
      
      const url = `/api/products${params.toString() ? `?${params.toString()}` : ''}`;
      return await oliGetJson<ProductDto[]>(url);
    } catch (error) {
      console.error('Error fetching products:', error);
      return [];
    }
  };

  // Fetch categories from database
  const fetchCategories = async (): Promise<Category[]> => {
    try {
      return await oliGetJson<Category[]>('/api/categories');
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  };

  // Format product info for chatbot response
  const formatProductInfo = (products: ProductDto[], categoryName?: string) => {
    if (products.length === 0) {
      return "क्षमा करें, अभी कोई प्रोडक्ट उपलब्ध नहीं है।";
    }

    let response = categoryName ? `🛍️ **${categoryName} के प्रोडक्ट्स:**\n\n` : "🛍️ **उपलब्ध प्रोडक्ट्स:**\n\n";
    
    products.slice(0, 5).forEach((product, index) => {
      const stockStatus = product.inStock ? "✅ उपलब्ध" : "❌ स्टॉक में नहीं";
      const rating = product.rating ? `⭐ ${product.rating}` : "";
      const badge = product.bestseller ? "🔥 बेस्टसेलर" : product.featured ? "⭐ फीचर्ड" : "";
      
      response += `${index + 1}. **${product.name}**\n`;
      response += `   💰 कीमत: ₹${product.price}`;
      if (product.originalPrice && product.originalPrice > product.price) {
        response += ` (₹${product.originalPrice})`;
      }
      response += `\n   📦 ${stockStatus}`;
      if (rating) response += ` | ${rating}`;
      if (badge) response += ` | ${badge}`;
      if (product.size) response += `\n   📏 साइज: ${product.size}`;
      if (product.shortDescription) response += `\n   📝 ${product.shortDescription}`;
      response += "\n\n";
    });

    if (products.length > 5) {
      response += `और ${products.length - 5} और प्रोडक्ट्स उपलब्ध हैं।\n\n`;
    }

    response += "कौन सा प्रोडक्ट आप चाहते हैं?";
    return response;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      addBotMessage(
        "🙏 नमस्ते! मैं Rajyadu Organic Food का चैटबॉट हूं। मैं आपकी क्या मदद कर सकता हूं?\n\n" +
        "मैं आपको इनमें मदद कर सकता हूं:\n" +
        "🛒 प्रोडक्ट की जानकारी\n" +
        "📦 ऑर्डर ट्रैकिंग\n" +
        "🏠 होम डिलीवरी की जानकारी\n" +
        "💰 कीमत और स्टॉक स्टेटस\n" +
        "📞 WhatsApp कनेक्शन"
      );
    }
  }, [isOpen]);

  const addBotMessage = (text: string, type?: Message['type'], metadata?: any) => {
    const message: Message = {
      id: Date.now().toString(),
      text,
      sender: 'bot',
      timestamp: new Date(),
      type,
      metadata
    };
    setMessages(prev => [...prev, message]);
  };

  const addUserMessage = (text: string) => {
    const message: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);
  };

  const processUserMessage = async (userInput: string) => {
    const input = userInput.toLowerCase();
    
    setIsTyping(true);

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Product information queries
    if (input.includes('oil') || input.includes('तेल') || input.includes('oil')) {
      if (input.includes('best') || input.includes('बेस्ट') || input.includes('best')) {
        try {
          const products = await fetchProducts('', undefined);
          const bestProducts = products.filter(p => p.bestseller || p.rating && p.rating >= 4);
          const oilProducts = bestProducts.filter(p => 
            p.name.toLowerCase().includes('oil') || 
            p.name.toLowerCase().includes('तेल') ||
            p.shortDescription?.toLowerCase().includes('oil') ||
            p.shortDescription?.toLowerCase().includes('तेल')
          );
          
          if (oilProducts.length > 0) {
            addBotMessage(formatProductInfo(oilProducts, "बेस्ट ऑर्गेनिक ऑयल"), 'product');
          } else {
            addBotMessage(
              "🌟 **बेस्ट सेलिंग ऑर्गेनिक ऑयल:**\n\n" +
              "अभी हमारे पास ये ऑयल उपलब्ध हैं। कृपया कुछ देर बाद चेक करें।\n\n" +
              "या आप हमसे सीधे WhatsApp पर बात कर सकते हैं!",
              'product'
            );
          }
        } catch (error) {
          addBotMessage("क्षमा करें, प्रोडक्ट लोड करने में समस्या हो रही है। कृपया बाद में कोशिश करें।");
        }
      } else {
        try {
          const products = await fetchProducts('', undefined);
          const oilProducts = products.filter(p => 
            p.name.toLowerCase().includes('oil') || 
            p.name.toLowerCase().includes('तेल') ||
            p.shortDescription?.toLowerCase().includes('oil') ||
            p.shortDescription?.toLowerCase().includes('तेल')
          );
          
          addBotMessage(formatProductInfo(oilProducts, "ऑर्गेनिक ऑयल"), 'product');
        } catch (error) {
          addBotMessage("क्षमा करें, प्रोडक्ट लोड करने में समस्या हो रही है। कृपया बाद में कोशिश करें।");
        }
      }
    }
    // Milk and delivery queries
    else if (input.includes('milk') || input.includes('दूध') || input.includes('doodh')) {
      if (input.includes('delivery') || input.includes('डिलीवरी') || input.includes('home')) {
        try {
          const products = await fetchProducts('', undefined);
          const milkProducts = products.filter(p => 
            p.name.toLowerCase().includes('milk') || 
            p.name.toLowerCase().includes('दूध') ||
            p.name.toLowerCase().includes('doodh') ||
            p.shortDescription?.toLowerCase().includes('milk') ||
            p.shortDescription?.toLowerCase().includes('दूध')
          );
          
          let response = "🏠 **होम डिलीवरी उपलब्ध है**\n\n" +
                         "📅 **डिलीवरी टाइम:**\n" +
                         "• सुबह 6:00 - 9:00 बजे\n" +
                         "• शाम 5:00 - 8:00 बजे\n" +
                         "• एक्सप्रेस डिलीवरी भी उपलब्ध\n\n" +
                         "📍 **डिलीवरी चार्ज:**\n" +
                         "• 5km के अंदर - ₹40\n" +
                         "• 5-15km के अंदर - ₹60\n" +
                         "• 15km से बाहर - ₹80+\n" +
                         "• ₹500 से ज्यादा के ऑर्डर पर फ्री डिलीवरी!\n\n" +
                         "🚚 **डिलीवरी पार्टनर:**\n" +
                         "• Shiprocket (ऑल इंडिया)\n" +
                         "• लोकल डिलीवरी पार्टनर (सेम-डे)\n\n";
          
          if (milkProducts.length > 0) {
            response += formatProductInfo(milkProducts, "ऑर्गेनिक दूध");
          } else {
            response += "अभी दूध उपलब्ध नहीं है, जल्दी ही आ रहा है!";
          }
          
          response += "\nडेली डिलीवरी के लिए अपना नंबर दे सकते हैं!";
          
          addBotMessage(response, 'text');
          setShowPhoneInput(true);
        } catch (error) {
          addBotMessage("क्षमा करें, प्रोडक्ट लोड करने में समस्या हो रही है। कृपया बाद में कोशिश करें।");
        }
      } else {
        try {
          const products = await fetchProducts('', undefined);
          const milkProducts = products.filter(p => 
            p.name.toLowerCase().includes('milk') || 
            p.name.toLowerCase().includes('दूध') ||
            p.name.toLowerCase().includes('doodh') ||
            p.shortDescription?.toLowerCase().includes('milk') ||
            p.shortDescription?.toLowerCase().includes('दूध')
          );
          
          addBotMessage(formatProductInfo(milkProducts, "ऑर्गेनिक दूध"), 'product');
        } catch (error) {
          addBotMessage("क्षमा करें, प्रोडक्ट लोड करने में समस्या हो रही है। कृपया बाद में कोशिश करें।");
        }
      }
    }
    // General product queries
    else if (input.includes('product') || input.includes('प्रोडक्ट') || input.includes('जानकारी')) {
      try {
        const products = await fetchProducts('', undefined);
        const bestProducts = products.filter(p => p.bestseller || p.featured);
        
        addBotMessage(formatProductInfo(bestProducts, "लोकप्रिय प्रोडक्ट्स"), 'product');
      } catch (error) {
        addBotMessage("क्षमा करें, प्रोडक्ट लोड करने में समस्या हो रही है। कृपया बाद में कोशिश करें।");
      }
    }
    // Order tracking
    else if (input.includes('order') || input.includes('ऑर्डर') || input.includes('track') || input.includes('ट्रैक')) {
      addBotMessage(
        "📦 **ऑर्डर ट्रैकिंग के लिए:**\n\n" +
        "1. अपना ऑर्डर नंबर डालें\n" +
        "2. मोबाइल नंबर से ट्रैक करें\n\n" +
        "अपना ऑर्डर नंबर या मोबाइल नंबर बताएं, मैं आपका ऑर्डर ट्रैक कर दूंगा।\n\n" +
        "उदाहरण: \"मेरा ऑर्डर #12345 है\"",
        'order'
      );
    }
    // Price queries
    else if (input.includes('price') || input.includes('कीमत') || input.includes('rate') || input.includes('दाम')) {
      try {
        const products = await fetchProducts('', undefined);
        const categories = await fetchCategories();
        
        let response = "💰 **हमारे प्रोडक्ट्स की कीमतें:**\n\n";
        
        // Group by categories
        const productsByCategory = new Map<number, ProductDto[]>();
        products.forEach(product => {
          if (product.categoryId) {
            const categoryProducts = productsByCategory.get(product.categoryId) || [];
            categoryProducts.push(product);
            productsByCategory.set(product.categoryId, categoryProducts);
          }
        });
        
        productsByCategory.forEach((categoryProducts, categoryId) => {
          const category = categories.find(c => c.id === categoryId);
          if (category && categoryProducts.length > 0) {
            response += `🛒 **${category.name}:**\n`;
            categoryProducts.slice(0, 3).forEach(product => {
              response += `• ${product.name} - ₹${product.price}`;
              if (product.size) response += ` (${product.size})`;
              response += "\n";
            });
            response += "\n";
          }
        });
        
        response += "🚚 **डिलीवरी चार्ज:**\n" +
                    "• 5km के अंदर - ₹40\n" +
                    "• 5-15km के अंदर - ₹60\n" +
                    "• 15km से बाहर - ₹80+\n" +
                    "• ₹500 से ज्यादा पर फ्री डिलीवरी\n\n" +
                    "कौन सा प्रोडक्ट की कीमत जानना चाहते हैं?";
        
        addBotMessage(response, 'text');
      } catch (error) {
        addBotMessage("क्षमा करें, कीमतें लोड करने में समस्या हो रही है। कृपया बाद में कोशिश करें।");
      }
    }
    // WhatsApp connection
    else if (input.includes('whatsapp') || input.includes('व्हाट्सएप') || input.includes('contact') || input.includes('संपर्क')) {
      addBotMessage(
        "📞 **WhatsApp पर हमसे जुड़ें:**\n\n" +
        "🟢 **डायरेक्ट WhatsApp चैट:**\n" +
        "• नंबर: +91 8003845358\n" +
        "• टाइम: 8AM - 8PM\n\n" +
        "📱 **यहां क्लिक करें:**\n" +
        "https://wa.me/919876543210\n\n" +
        "मैं आपको WhatsApp पर भी कनेक्ट कर सकता हूं।" +
        "अपना नंबर दें और हमारी टीम आपसे संपर्क करेगी।",
        'whatsapp'
      );
      setShowPhoneInput(true);
    }
    // Help/FAQ
    else if (input.includes('help') || input.includes('मदद') || input.includes('सवाल') || input.includes('faq')) {
      addBotMessage(
        "❓ **अक्सर पूछे जाने वाले सवाल:**\n\n" +
        "🔄 **रिटर्न पॉलिसी:**\n" +
        "• 24 घंटे के अंदर रिटर्न\n" +
        "• खराब प्रोडक्ट तुरंत रिप्लेस\n\n" +
        "💳 **पेमेंट ऑप्शन:**\n" +
        "• कैश ऑन डिलीवरी\n" +
        "• UPI, डेबिट कार्ड\n" +
        "• वॉलेट पेमेंट\n\n" +
        "🚚 **डिलीवरी:**\n" +
        "• समय: 2-4 घंटे\n" +
        "• चार्ज: 15km तक फ्री\n\n" +
        "और कोई सवाल है?",
        'text'
      );
    }
    // Greetings
    else if (input.includes('hello') || input.includes('hi') || input.includes('नमस्ते') || input.includes('हेलो')) {
      addBotMessage(
        "🙏 नमस्ते! मैं आपकी क्या मदद कर सकता हूं?\n\n" +
        "मैं आपको बता सकता हूं:\n" +
        "🛒 प्रोडक्ट की जानकारी\n" +
        "💰 कीमतें और ऑफर्स\n" +
        "📦 ऑर्डर स्टेटस\n" +
        "🏠 होम डिलीवरी\n" +
        "📞 WhatsApp कनेक्शन"
      );
    }
    // Default response
    else {
      addBotMessage(
        "मैं आपकी मदद करना चाहूंगा। कृपया बताएं:\n\n" +
        "🔹 कौन सा प्रोडक्ट चाहिए?\n" +
        "🔹 ऑर्डर ट्रैक करना है?\n" +
        "🔹 होम डिलीवरी की जानकारी?\n" +
        "🔹 WhatsApp पर बात करना है?\n\n" +
        "या मुझे कॉल करें: +91 8003845358"
      );
    }

    setIsTyping(false);
  };

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      addUserMessage(inputValue);
      processUserMessage(inputValue);
      setInputValue('');
    }
  };

  const handlePhoneSubmit = () => {
    if (userPhone.trim()) {
      addBotMessage(
        `✅ **धन्यवाद!**\n\n` +
        `आपका नंबर: ${userPhone}\n` +
        `हमारी टीम जल्दी ही आपसे संपर्क करेगी।\n\n` +
        `📞 **इमीडिएट कॉल के लिए:**\n` +
        `+91 8003845358\n\n` +
        `⏰ **टाइमिंग:** 8AM - 8PM`,
        'text'
      );
      setUserPhone('');
      setShowPhoneInput(false);
    }
  };

  const quickActions = [
    { icon: Package, text: "प्रोडक्ट जानकारी", action: () => setInputValue("ऑर्गेनिक तेल की जानकारी") },
    { icon: Truck, text: "ऑर्डर ट्रैक", action: () => setInputValue("मेरा ऑर्डर ट्रैक करें") },
    { icon: Phone, text: "WhatsApp कनेक्ट", action: () => setInputValue("WhatsApp पर बात करना है") },
    { icon: HelpCircle, text: "मदद", action: () => setInputValue("मदद चाहिए") }
  ];

  return (
    <div className="fixed bottom-20 right-4 z-50 sm:bottom-4">
      {!isOpen ? (
        <Button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full shadow-lg bg-green-600 hover:bg-green-700 text-white"
          size="icon"
        >
          <MessageCircle className="w-6 h-6" />
        </Button>
      ) : (
        <Card className="h-[70vh] w-[90vw] max-w-sm shadow-2xl sm:h-[600px] sm:w-96">
          <CardHeader className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8 bg-white">
                  <AvatarFallback className="bg-green-600 text-white">
                    <Bot className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-sm">Rajyadu Assistant</CardTitle>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-100">Online - हिंदी/English</span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-green-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0 h-[calc(100%-80px)] flex flex-col">
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex gap-2 max-w-[80%] ${message.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                      <Avatar className="w-6 h-6 flex-shrink-0">
                        <AvatarFallback className={message.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'}>
                          {message.sender === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className={`rounded-lg p-3 ${
                          message.sender === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-line">{message.text}</p>
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="w-3 h-3 opacity-60" />
                          <span className="text-xs opacity-60">
                            {message.timestamp.toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="flex gap-2 max-w-[80%]">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="bg-green-600 text-white">
                          <Bot className="w-3 h-3" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-gray-100 rounded-lg p-3">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {showPhoneInput && (
              <div className="p-4 border-t bg-gray-50">
                <div className="space-y-2">
                  <p className="text-sm font-medium">अपना नंबर दें:</p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="मोबाइल नंबर"
                      value={userPhone}
                      onChange={(e) => setUserPhone(e.target.value)}
                      className="flex-1"
                    />
                    <Button size="sm" onClick={handlePhoneSubmit}>
                      Send
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowPhoneInput(false)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="p-4 border-t">
              <div className="grid grid-cols-2 gap-2 mb-3">
                {quickActions.map((action, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={action.action}
                    className="text-xs h-8 flex items-center gap-1"
                  >
                    <action.icon className="w-3 h-3" />
                    {action.text}
                  </Button>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Type your message..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} size="icon" disabled={!inputValue.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Chatbot;
