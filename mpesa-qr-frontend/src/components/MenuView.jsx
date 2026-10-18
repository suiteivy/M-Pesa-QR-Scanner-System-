import React from 'react';
import { Plus, Minus } from 'lucide-react';

const MenuView = ({
  items = [],
  onItemClick,
  onAddToCart,
  onRemoveFromCart,
  cartItems = [],
  isCartMode = false,
}) => {
  const getCategory = (item) => item.category?.trim() || 'General';
  const categories = [...new Set(items.map(getCategory))];

  const getQty = (itemName) => {
    const entry = cartItems.find((c) => (c.item?.name || c.item) === itemName);
    return entry ? entry.qty : 0;
  };

  const handleAdd = (e, item) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(item);
    } else if (onItemClick) {
      onItemClick(item);
    }
  };

  const handleRemove = (e, item) => {
    e.stopPropagation();
    if (onRemoveFromCart) {
      onRemoveFromCart(item.name);
    }
  };

  if (!items || items.length === 0) {
    return (
      <div className="text-center py-20 bg-gray-50 dark:bg-zinc-900 rounded-2xl border-2 border-dashed border-gray-200 dark:border-zinc-800">
        <p className="text-gray-400 dark:text-zinc-500 font-medium">This merchant hasn't added any items yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {categories.map((category) => (
        <div key={category} className="space-y-5">
          {/* Category Header */}
          <div className="flex items-center gap-4">
            <h2 className="text-[11px] uppercase tracking-[0.3em] font-black text-orange-600 ml-1 italic">
              {category}
            </h2>
            <div className="h-[1px] flex-grow bg-zinc-200 dark:bg-zinc-700" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {items
              .filter((item) => getCategory(item) === category)
              .map((item, itemIndex) => {
                const isAvailable = item.isAvailable !== false;
                const qty = getQty(item.name);
                const inCart = qty > 0;

                return (
                  <div
                    key={item.id || `${category}-${item.name}-${itemIndex}`}
                    className={`group relative bg-white dark:bg-zinc-900 p-6 rounded-[32px] shadow-sm border transition-all ${
                      isAvailable
                        ? `cursor-pointer active:scale-[0.98] ${
                            inCart
                              ? 'border-orange-400/60 dark:border-orange-500/40 shadow-orange-600/10 shadow-lg ring-2 ring-orange-500/20'
                              : 'border-zinc-100 dark:border-zinc-800 hover:shadow-xl hover:shadow-orange-600/5 hover:border-orange-600/30'
                          }`
                        : 'opacity-50 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 cursor-not-allowed'
                    }`}
                    onClick={() => {
                      if (isAvailable) {
                        if (onAddToCart) onAddToCart(item);
                        else if (onItemClick) onItemClick(item);
                      }
                    }}
                  >
                    <div className="flex items-start gap-4">
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.name ? `${item.name} dish` : 'Menu item'}
                          loading="lazy"
                          className="h-24 w-24 sm:h-28 sm:w-28 shrink-0 rounded-2xl object-cover"
                        />
                      )}
                      <div className="flex min-w-0 flex-grow justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-black text-zinc-950 dark:text-white text-xl tracking-tight group-hover:text-orange-600 transition-colors">
                            {item.name || 'Untitled Dish'}
                          </h3>
                          {item.description && (
                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5 line-clamp-2 font-medium leading-relaxed">
                              {item.description}
                            </p>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-xl font-black text-orange-600 flex items-center justify-end tracking-tighter">
                            {item.price || '0'}
                            <span className="text-[10px] ml-1 uppercase text-zinc-400 font-black tracking-widest">
                              Kes
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Footer Row: Sold Out badge or Add-to-Cart controls */}
                    <div className="mt-4 flex items-center justify-between">
                      <div>
                        {!isAvailable && (
                          <span className="bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-[10px] px-3 py-1.5 rounded-full font-black uppercase tracking-widest border border-red-100 dark:border-red-900/50">
                            Sold Out
                          </span>
                        )}
                      </div>

                      {isAvailable && isCartMode && (
                        <div>
                          {inCart ? (
                            <div className="flex items-center gap-2 bg-orange-600 text-white rounded-full px-2 py-1 shadow-md shadow-orange-600/30">
                              <button
                                type="button"
                                onClick={(e) => handleRemove(e, item)}
                                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-black/20 active:scale-90 transition-transform cursor-pointer"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="text-xs font-black px-1 min-w-[16px] text-center">
                                {qty}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => handleAdd(e, item)}
                                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-black/20 active:scale-90 transition-transform cursor-pointer"
                                aria-label="Increase quantity"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => handleAdd(e, item)}
                              className="bg-orange-600 hover:bg-orange-700 active:scale-95 text-white text-xs font-black px-4 py-1.5 rounded-full flex items-center gap-1.5 shadow-md shadow-orange-600/30 transition-all cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MenuView;