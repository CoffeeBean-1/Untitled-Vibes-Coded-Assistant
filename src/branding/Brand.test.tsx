import { render,screen } from '@testing-library/react';
import { describe,expect,it } from 'vitest';
import { Brand } from './Brand';
import { BRAND,brandAssetUrl } from './identity';

describe('approved CAi identity',()=>{
  it('uses local theme variants and hides both tagline sentences with satire off',()=>{
    const {container,rerender}=render(<Brand dark={false} signature satire />);
    expect(screen.getByAltText('CAi')).toHaveAttribute('src','/branding/cai/cai-wordmark-light.svg');
    expect(container.querySelector('.cai-brand-symbol')).toHaveAttribute('src','/branding/cai/cai-mark-128.png');
    expect(container.querySelector('.cai-brand-tagline')?.textContent).toBe(BRAND.tagline);
    rerender(<Brand dark signature satire={false} />);
    expect(screen.queryByText(BRAND.taglineLines[0])).not.toBeInTheDocument(); expect(screen.queryByText(BRAND.taglineLines[1])).not.toBeInTheDocument();
    expect(screen.getByAltText('CAi')).toHaveAttribute('src','/branding/cai/cai-wordmark-dark.svg');
  });
  it('resolves local subpaths and rejects remote/traversing asset bases',()=>{
    expect(brandAssetUrl('cai-mark-128.png','/cai/')).toBe('/cai/branding/cai/cai-mark-128.png');
    for(const base of ['https://example.test','//example.test/','/../','/a?b/']) expect(()=>brandAssetUrl('cai-mark-128.png',base)).toThrow();
  });
});
