import {Form, useParams, useNavigate} from '@remix-run/react';
import {useEffect, useId, useState} from 'react';

import type {SearchSuggestions} from '~/data/search';

export function SearchForm({
  initialQuery = '',
  category = 'products',
  compact = false,
}: {
  initialQuery?: string;
  category?: string;
  compact?: boolean;
}) {
  const {locale} = useParams();
  const prefix = locale ? `/${locale}` : '';
  const [suggestions, setSuggestions] = useState<SearchSuggestions>();
  const navigate = useNavigate();
  const id = useId();
  const [query, setQuery] = useState(initialQuery);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const normalized = query.trim().slice(0, 200);
  useEffect(() => {
    if (!open || normalized.length < 2 || category !== 'products') return;
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      fetch(`${prefix}/api/search?q=${encodeURIComponent(normalized)}`, {
        signal: controller.signal,
      })
        .then((response) => {
          if (!response.ok) throw new Error('Search unavailable');
          return response.json() as Promise<SearchSuggestions>;
        })
        .then((data) => {
          if (!controller.signal.aborted) setSuggestions(data);
        })
        .catch(() => {
          if (!controller.signal.aborted)
            setSuggestions({
              query: normalized,
              products: [],
              unavailable: true,
            });
        });
    }, 250);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [normalized, open, prefix, category]);
  const current = suggestions?.query === normalized ? suggestions : undefined;
  const products = current?.products ?? [];
  const show = open && normalized.length >= 2 && category === 'products';
  return (
    <Form
      method="get"
      action={`${prefix}/search`}
      role="search"
      className={
        compact ? 'relative w-40 md:w-52' : 'relative w-full max-w-3xl'
      }
      onSubmit={(event) => {
        if (show && active >= 0 && products[active]) {
          event.preventDefault();
          navigate(`${prefix}/products/${products[active].handle}`);
        }
        setOpen(false);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <input type="hidden" name="type" value={category} />
      <div className="flex items-center gap-2 rounded border border-primary/20 bg-contrast text-primary focus-within:ring-2 focus-within:ring-secondary">
        <label htmlFor={id} className="sr-only">
          Search the shop
        </label>
        <input
          id={id}
          type="search"
          name="q"
          value={query}
          maxLength={200}
          placeholder="Search the shop"
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={show}
          aria-controls={`${id}-results`}
          aria-activedescendant={
            active >= 0 && products[active] ? `${id}-${active}` : undefined
          }
          className="min-w-0 w-full rounded border-0 bg-transparent px-3 py-2 text-sm focus:ring-0"
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setOpen(false);
              setActive(-1);
            }
            if (
              show &&
              products.length &&
              (event.key === 'ArrowDown' || event.key === 'ArrowUp')
            ) {
              event.preventDefault();
              setActive((index) =>
                event.key === 'ArrowDown'
                  ? (index + 1) % products.length
                  : index <= 0
                  ? products.length - 1
                  : index - 1,
              );
            }
          }}
        />
        <button
          type="submit"
          aria-label="Submit search"
          className="rounded bg-secondary px-3 py-2 text-sm font-medium text-primary"
        >
          Go
        </button>
      </div>
      {show && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 rounded border border-primary/10 bg-contrast text-primary shadow-lg">
          <p role="status" className="px-3 py-2 text-sm">
            {!current
              ? 'Searching…'
              : current.unavailable
              ? 'Suggestions unavailable. Press Go to search.'
              : products.length
              ? 'Suggested products'
              : 'No product suggestions. Try a different term.'}
          </p>
          <ul
            id={`${id}-results`}
            role="listbox"
            aria-label="Suggested products"
          >
            {products.map((product, index) => (
              <li
                key={product.id}
                id={`${id}-${index}`}
                role="option"
                aria-selected={active === index}
                className={`cursor-pointer px-3 py-3 text-sm hover:bg-accent ${
                  active === index ? 'bg-accent' : ''
                }`}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    setOpen(false);
                    navigate(`${prefix}/products/${product.handle}`);
                  }
                }}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  setOpen(false);
                  navigate(`${prefix}/products/${product.handle}`);
                }}
              >
                {product.title}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Form>
  );
}
