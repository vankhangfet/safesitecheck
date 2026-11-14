import { createPopupApi } from './popupApi';
import { initPopup } from './popupView';

void initPopup(document, createPopupApi(chrome));
