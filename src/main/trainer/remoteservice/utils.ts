import { getBaseUrl } from './client';
import { DatasetItem, OriginalItem } from '../../../types';

export const makeDataItemRealLink = (item: DatasetItem) => {
  if (item.originalPath) {
    item.originalPath = getBaseUrl() + item.originalPath;
  }
  if(item.imagePath) {
    item.imagePath = getBaseUrl() + item.imagePath;
  }
  if (item.captionPath) {
    item.captionPath = getBaseUrl() + item.captionPath;
  }
  return item;
}

export const makeDataItemsRealLink = (items: DatasetItem[]) => {
  items.forEach((item) => {
    makeDataItemRealLink(item)
  })
}

export const makeOriginalItemsRealLink = (item: OriginalItem) => {
  if (item.src) {
    item.src = getBaseUrl() + item.src;
  }
  if (item.thumbnail) {
    item.thumbnail = getBaseUrl() + item.thumbnail;
  }
  return item;
}

export const makeOriginalItemsRealLinks = (items: OriginalItem[]) => {
  items.forEach((item) => {
    makeOriginalItemsRealLink(item)
  })
}
