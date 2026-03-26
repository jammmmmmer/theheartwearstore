import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CartItem } from '@/types'

interface CartStore {
  items: CartItem[]
  isOpen: boolean
  addItem: (item: CartItem) => void
  removeItem: (productId: string, variantId: number) => void
  updateQuantity: (productId: string, variantId: number, quantity: number) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
  totalItems: () => number
  totalPrice: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (item: CartItem) => {
        set((state) => {
          const existingIndex = state.items.findIndex(
            (i) => i.product_id === item.product_id && i.variant_id === item.variant_id
          )
          if (existingIndex >= 0) {
            const updatedItems = [...state.items]
            updatedItems[existingIndex] = {
              ...updatedItems[existingIndex],
              quantity: updatedItems[existingIndex].quantity + item.quantity,
            }
            return { items: updatedItems }
          }
          return { items: [...state.items, item] }
        })
      },

      removeItem: (productId: string, variantId: number) => {
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.product_id === productId && i.variant_id === variantId)
          ),
        }))
      },

      updateQuantity: (productId: string, variantId: number, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(productId, variantId)
          return
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.product_id === productId && i.variant_id === variantId
              ? { ...i, quantity }
              : i
          ),
        }))
      },

      clearCart: () => set({ items: [] }),

      openCart: () => set({ isOpen: true }),

      closeCart: () => set({ isOpen: false }),

      totalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0)
      },

      totalPrice: () => {
        return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0)
      },
    }),
    {
      name: 'heartwear-cart',
    }
  )
)
