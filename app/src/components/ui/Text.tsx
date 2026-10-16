import { Text as RNText, type TextProps } from 'react-native';

const HAS_COLOR = /(^|\s)(text-(slate|white|black|emerald|amber|orange|red|rose|indigo|sky|teal|cyan|pink|brand|transparent)\b)/;

type Props = TextProps & { className?: string };

/**
 * App-wide text: Inter by default (Outfit with `font-display`), slate-900 unless a colour is given.
 * `truncate` becomes a single line with an ellipsis, like the web class.
 */
export default function Text({ className = '', numberOfLines, ...props }: Props) {
  const truncate = /(^|\s)truncate(\s|$)/.test(className);
  const family = /(^|\s)font-display(\s|$)/.test(className) ? '' : 'font-sans ';
  const color = HAS_COLOR.test(className) ? '' : 'text-slate-900 ';
  const cls = className.replace(/(^|\s)truncate(?=\s|$)/g, ' ');
  return <RNText className={`${family}${color}${cls}`} numberOfLines={truncate ? 1 : numberOfLines} {...props} />;
}
