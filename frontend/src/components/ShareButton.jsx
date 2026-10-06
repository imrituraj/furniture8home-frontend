import { useState } from 'react';
import { ShareIcon } from './Icons.jsx';
import { productUrl } from '../lib/productLink.js';
import { useLang } from '../i18n/LanguageContext.jsx';

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const input = document.createElement('textarea');
    input.value = text;
    input.setAttribute('readonly', '');
    input.style.position = 'fixed';
    input.style.left = '-9999px';
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    input.remove();
  }
}

export default function ShareButton({ product, className = '', label = '' }) {
  const { t } = useLang();
  const [copied, setCopied] = useState(false);
  const shareLabel = label || t('share');

  async function share(event) {
    event.preventDefault();
    event.stopPropagation();
    const url = productUrl(product.slug);
    const payload = {
      title: t('docTitleProduct', { name: product.name }),
      text: t('shareText', { name: product.name, price: product.price }),
      url,
    };

    if (navigator.share) {
      try {
        await navigator.share(payload);
        return;
      } catch (error) {
        if (error?.name === 'AbortError') return;
      }
    }

    await copyText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  const text = copied ? t('copied') : shareLabel;

  return (
    <button
      type="button"
      className={`${className}${copied ? ' is-copied' : ''}`}
      onClick={share}
      title={copied ? t('copied') : t('shareTitle')}
      aria-label={label ? text : (copied ? t('copied') : `${t('share')} ${product.name}`)}
    >
      <ShareIcon size={label ? 16 : 17} />
      {label ? <span>{text}</span> : null}
    </button>
  );
}
