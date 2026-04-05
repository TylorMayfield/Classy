import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'claimday.cart';

export type CartState = Record<string, { addedAt: string }>;

export function useCartStore() {
  const [cart, setCart] = useState<CartState>({});

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (!value) return;
        setCart(JSON.parse(value) as CartState);
      })
      .catch(() => undefined);
  }, []);

  const persist = async (next: CartState) => {
    setCart(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const addToCart = (id: string) => {
    if (cart[id]) return;
    void persist({ ...cart, [id]: { addedAt: new Date().toISOString() } });
  };

  const removeFromCart = (id: string) => {
    const next = { ...cart };
    delete next[id];
    void persist(next);
  };

  const inCart = (id: string) => Boolean(cart[id]);

  return { cart, addToCart, removeFromCart, inCart };
}
