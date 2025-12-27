(() => {
  const DEFAULT_ENDPOINT = window.AppConfig.BACKEND_BASE_URL + '/gstechsecurity/products';
  const DEFAULT_TABLE_BODY_ID = 'productsTableBody';
  const DEFAULT_LOADING_MESSAGE = 'Loading products...';
  const DEFAULT_EMPTY_MESSAGE = 'No products found';
  const DEFAULT_ERROR_MESSAGE = 'Error loading products. Please try again later.';
  const DEFAULT_CURRENCY = '₹';

  const normalize = (value) => (value ?? '').toString().trim().toLowerCase();

  const toArray = (keywords) => {
    if (!keywords) return [];
    if (Array.isArray(keywords)) return keywords.filter(Boolean).map(normalize);
    if (typeof keywords === 'string') {
      return keywords
        .split(',')
        .map(normalize)
        .filter(Boolean);
    }
    return [];
  };

  const extractValue = (source, keys) => {
    if (!source || typeof source !== 'object') return '';
    for (const key of keys) {
      if (source[key] !== undefined && source[key] !== null && source[key] !== '') {
        return source[key];
      }
    }
    return '';
  };

  const extractNumber = (source, keys) => {
    const raw = extractValue(source, keys);
    const num = Number(raw);
    return Number.isFinite(num) ? num : 0;
  };

  const productMatches = (product, keywords) => {
    if (!keywords.length) return true;
    if (typeof product === 'string') {
      const lowerProduct = product.toLowerCase();
      return keywords.some((keyword) => lowerProduct.includes(keyword));
    }

    const searchableFields = [
      extractValue(product, ['productName', 'name', 'title']),
      extractValue(product, ['productCode', 'code', 'model']),
      extractValue(product, ['companyName', 'company', 'brand']),
      extractValue(product, ['productCategory', 'category', 'type']),
      extractValue(product, ['description']),
    ]
      .join(' ')
      .toLowerCase();

    return keywords.some((keyword) => searchableFields.includes(keyword));
  };

  const spinnerRow = (message) => `
    <tr>
      <td colspan="4" class="text-center">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">${message}</span>
        </div>
        <p class="mt-2 mb-0">${message}</p>
      </td>
    </tr>
  `;

  const emptyRow = (message) => `
    <tr>
      <td colspan="4" class="text-center text-muted">${message}</td>
    </tr>
  `;

  const errorRow = (title, details) => `
    <tr>
      <td colspan="4" class="text-center text-danger">
        <p class="mb-1"><strong>${title}</strong></p>
        <small>${details}</small><br>
        <small class="text-muted">Check the console for more details.</small>
      </td>
    </tr>
  `;

  const formatCurrency = (symbol, price) => {
    if (price === 0 || Number.isNaN(price)) {
      return `${symbol}---`;
    }
    return `${symbol}${price}`;
  };

  const companyMatches = (product, companyFilters) => {
    if (!companyFilters.length) return true;
    const companyName = extractValue(product, ['companyName', 'company', 'brand']).toLowerCase();
    if (!companyName) return false;
    return companyFilters.some((filter) => companyName.includes(filter));
  };

  const buildSecondaryLine = (productCode, productPrice, companyName) => {
    const parts = [];
    if (productCode) parts.push(productCode);
    if (productPrice) parts.push(`@${productPrice}`);
    if (companyName) parts.push(companyName);
    return parts.join(' ');
  };

  const createRow = (product, config, index) => {
    const currencySymbol = config.currencySymbol || DEFAULT_CURRENCY;
    const productId =
      extractValue(product, ['productId', 'id', 'sku']) || (typeof product === 'string' ? `product-${index}` : '');
    const productName =
      extractValue(product, ['productName', 'name', 'title']) ||
      (typeof product === 'string' ? product : 'Product');
    const productCode = extractValue(product, ['productCode', 'code', 'model']);
    const companyName = extractValue(product, ['companyName', 'company', 'brand']);
    const productPrice = extractNumber(product, ['productPrice', 'price', 'rate', 'amount']);

    const row = document.createElement('tr');

    const productCell = document.createElement('td');
    if (productName) {
      const strong = document.createElement('strong');
      strong.textContent = productName;
      productCell.appendChild(strong);
    }

    const secondaryLine = buildSecondaryLine(productCode, productPrice, companyName);
    if (secondaryLine) {
      productCell.appendChild(document.createElement('br'));
      productCell.appendChild(document.createTextNode(secondaryLine));
    }

    const priceCell = document.createElement('td');
    priceCell.textContent = formatCurrency(currencySymbol, productPrice);

    const qtyCell = document.createElement('td');
    const qtyInput = document.createElement('input');
    qtyInput.type = 'number';
    qtyInput.className = 'form-control w-75 mx-auto';
    qtyInput.placeholder = 'Qty';
    qtyInput.min = '1';
    qtyInput.setAttribute('data-product-id', productId);
    qtyCell.appendChild(qtyInput);

    const actionCell = document.createElement('td');
    const addButton = document.createElement('button');
    addButton.className = 'btn btn-success btn-custom';
    addButton.textContent = config.addToCartLabel || 'Add to Cart';
    addButton.addEventListener('click', () => {
      const quantity = Math.max(1, parseInt(qtyInput.value, 10) || 1);
      handleAddToCart({
        productId,
        productName,
        companyName,
        productPrice,
        quantity,
      });
      qtyInput.value = '';
    });
    actionCell.appendChild(addButton);

    row.appendChild(productCell);
    row.appendChild(priceCell);
    row.appendChild(qtyCell);
    row.appendChild(actionCell);

    return row;
  };

  const getStoredAuth = () => {
    try {
      const raw = localStorage.getItem('gstech_auth');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.error('Failed to read auth from storage', e);
      return null;
    }
  };

  const CART_ENDPOINT = window.AppConfig.BACKEND_BASE_URL + '/gstechsecurity/product/addToCart';

  const handleAddToCart = async (details) => {
    console.log('Adding to cart:', details);

    const payload = {
      product: {
        companyName: details.companyName,
        productName: details.productName,
        productPrice: Number(details.productPrice),
      },
      quantity: Number(details.quantity),
    };

    console.log('Sending payload:', payload);

    const auth = getStoredAuth();
    const headers = {
      'Content-Type': 'application/json',
    };
    if (auth && auth.token) {
      headers['Authorization'] = 'Bearer ' + auth.token;
    }

    try {
      const response = await fetch(CART_ENDPOINT, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Add to cart failed with status ${response.status}`);
      }

      alert(`Added ${details.quantity} x ${details.productName} to cart!`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('Failed to add item to cart. Please try again.');
    }
  };

  window.initProductTable = function initProductTable(userConfig = {}) {
    const config = {
      tableBodyId: userConfig.tableBodyId || DEFAULT_TABLE_BODY_ID,
      apiEndpoint: userConfig.apiEndpoint || DEFAULT_ENDPOINT,
      filterKeywords: toArray(userConfig.filterKeywords || userConfig.filterKeyword),
      companyFilters: toArray(
        userConfig.companyFilters ||
        userConfig.companyFilter ||
        userConfig.company ||
        userConfig.brand ||
        userConfig.brandName
      ),
      emptyMessage: userConfig.emptyMessage || DEFAULT_EMPTY_MESSAGE,
      loadingMessage: userConfig.loadingMessage || DEFAULT_LOADING_MESSAGE,
      currencySymbol: userConfig.currencySymbol || DEFAULT_CURRENCY,
      addToCartLabel: userConfig.addToCartLabel || 'Add to Cart',
    };

    const tbody = document.getElementById(config.tableBodyId);
    if (!tbody) {
      console.warn(`Table body with id "${config.tableBodyId}" not found.`);
      return;
    }

    console.log('[ProductLoader] Initializing table', {
      tableBodyId: config.tableBodyId,
      endpoint: config.apiEndpoint,
      filters: config.filterKeywords,
      companyFilters: config.companyFilters,
    });

    tbody.innerHTML = spinnerRow(config.loadingMessage);

    console.log('[ProductLoader] Fetching products from API:', config.apiEndpoint);
    fetch(config.apiEndpoint)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        const productsArray = Array.isArray(data) ? data : [];
        console.log('[ProductLoader] Products received:', productsArray.length);
        const filteredProducts = productsArray.filter(
          (product) => productMatches(product, config.filterKeywords) && companyMatches(product, config.companyFilters)
        );
        console.log('[ProductLoader] Products after filtering:', filteredProducts.length);

        if (!filteredProducts.length) {
          tbody.innerHTML = emptyRow(config.emptyMessage);
          return;
        }

        tbody.innerHTML = '';
        filteredProducts.forEach((product, index) => {
          tbody.appendChild(createRow(product, config, index));
        });
      })
      .catch((error) => {
        console.error('Error loading products:', error);
        let title = DEFAULT_ERROR_MESSAGE;
        let details = error.message || 'Unknown error';

        if (details.includes('Access-Control-Allow-Origin')) {
          title = 'CORS Error: Unable to connect to API server';
          details = 'Allow requests from this origin in the backend server.';
        } else if (details.includes('Failed to fetch') || details.includes('NetworkError')) {
          title = 'Network Error: Unable to reach API server';
          details = `Ensure the API server is running at ${config.apiEndpoint}`;
        }

        tbody.innerHTML = errorRow(title, details);
      });
  };
})();