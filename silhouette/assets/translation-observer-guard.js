(() => {
  const NativeMutationObserver = window.MutationObserver;
  if (!NativeMutationObserver) return;
  let observerIndex = 0;

  window.MutationObserver = class FilteredMutationObserver extends NativeMutationObserver {
    constructor(callback) {
      observerIndex += 1;
      const isTranslationObserver = observerIndex === 2;
      super((records, observer) => {
        if (!isTranslationObserver) {
          callback(records, observer);
          return;
        }
        const relevantRecords = records.filter(record => {
          if (record.type !== 'childList') return false;
          return Array.from(record.addedNodes).some(node => {
            if (node.nodeType === Node.TEXT_NODE) return Boolean(node.nodeValue?.trim());
            if (node.nodeType !== Node.ELEMENT_NODE) return false;
            return !node.closest('.product-card__viewer') && Boolean(node.textContent?.trim());
          });
        });
        if (relevantRecords.length) callback(relevantRecords, observer);
      });
    }
  };
})();
