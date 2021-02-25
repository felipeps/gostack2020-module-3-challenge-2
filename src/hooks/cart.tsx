import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const addedProducts = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );

      if (addedProducts) {
        setProducts(JSON.parse(addedProducts));
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const productsUpdated = products.map(product => {
        if (product.id === id) {
          const productUpdated = product;

          productUpdated.quantity += 1;

          return productUpdated;
        }
        return product;
      });

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(productsUpdated),
      );

      setProducts(productsUpdated);
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const productsUpdated = [...products];
      const productIndex = productsUpdated.findIndex(
        product => product.id === id,
      );
      const productUpdated = productsUpdated[productIndex];

      if (productUpdated.quantity === 1) {
        productsUpdated.splice(productIndex, 1);
      } else {
        productUpdated.quantity -= 1;
        productsUpdated.splice(productIndex, 1, productUpdated);
      }

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(productsUpdated),
      );

      setProducts(productsUpdated);
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const productExists = products.find(p => p.id === product.id);

      if (productExists) {
        increment(product.id);
        return;
      }

      const newProduct = { ...product, quantity: 1 };
      const productsUpdated = [...products, newProduct];

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(productsUpdated),
      );

      setProducts(productsUpdated);
    },
    [products, increment],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
