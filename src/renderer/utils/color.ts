export const getTypeColor = (type: string) => {
  switch (type) {
    case 'error':
      return '#ff2c2c';
    case 'warning':
      return '#ffb737';
    case 'info':
      return '#008252';
  }
};
