import { createRoot } from 'react-dom/client';

import './index.css';

import Popup from './Popup';

const rootElement = document.getElementById('root');

if (rootElement) {
  createRoot(rootElement).render(<Popup />);
}
