import { BRAND, brandAssetUrl } from './identity';
import './brand.css';

export function Brand({ dark, signature=false, satire=false, decorative=false }: { dark: boolean; signature?: boolean; satire?: boolean; decorative?: boolean }) {
  return <span className={`cai-brand${signature ? ' cai-brand-signature' : ''}`} aria-hidden={decorative || undefined}>
    <img className="cai-brand-symbol" src={brandAssetUrl('cai-mark-128.png')} width={signature ? 64 : 40} height={signature ? 64 : 40} alt="" draggable={false} />
    <span className="cai-brand-copy"><img className="cai-brand-wordmark" src={brandAssetUrl(dark ? 'cai-wordmark-dark.svg' : 'cai-wordmark-light.svg')} width={119} height={60} alt={decorative ? '' : BRAND.wordmark} draggable={false} /><span className="cai-forced-label" aria-hidden="true">{BRAND.wordmark}</span>
      {signature && satire && <span className="cai-brand-tagline">{BRAND.taglineLines.map((line,index)=><span key={line}>{index>0 ? ' ' : ''}{line}</span>)}</span>}
    </span>
  </span>;
}
