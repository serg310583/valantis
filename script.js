const password = 'Valantis';
const timeStamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
const authHeader = CryptoJS.MD5(`${password}_${timeStamp}`);

const limit = 50; // количество товара на странице
const url = 'http://api.valantis.store:40000/';
const headersApi = {
  'Content-Type': 'application/json',
  'X-Auth': authHeader,
};
//тело запроса для получения всех ID
const bodyApiAddAllIds = {
  action: 'get_ids',
};
const productList = document.querySelector('.ProductList');
const paginatonList = document.querySelector('.pagination');

let totalPages;
const pageCache = {};
const productCache = {};
//----------------получаем количество всего товара по ID---------------------------
async function getAllIds() {
  let allIds;
  let data;
  let response;
  let quantityProduct;
  do {
    response = await fetch(url, {
      method: 'POST',
      headers: headersApi,
      body: JSON.stringify(bodyApiAddAllIds),
    });
    if (!response.ok) {
      const message = `An error has occured: ${response.status}`;
      console.error(message);
    } else {
      data = await response.json();
      // allIds = Array.from(new Set(data.result));
      allIds = data.result;
      quantityProduct = allIds.length;
    }
  } while (!response.ok);
  totalPages = Math.ceil(quantityProduct / limit); // получаем количество страниц с товаром
  return totalPages; //получаем количество всего товара
}
getAllIds().then((totalPages) => {
  pagination(totalPages, 1);
  getListIds(1);
});

//-----------------функция удалиния дубликатов в массиве продуктов ---------------------
function removeDuplicates(array, idKey) {
  const uniqueIds = new Set();
  return array.filter(
    (item) => !uniqueIds.has(item[idKey]) && uniqueIds.add(item[idKey])
  );
}
//очистка страницы товара

function clearList(item) {
  item.innerHTML = '';
}

//-----------------функция рендера списка товара--------------------------------

function renderProduct(uniqueProducts) {
  uniqueProducts.forEach((item) => {
    const { id, product, price, brand } = item;

    const itemElement = document.createElement('li');
    itemElement.classList.add('ProductList__item');

    const elements = [
      {
        class: 'item_id',
        textContent: id,
      },
      {
        class: 'item_product',
        textContent: product,
      },
      {
        class: 'item_price',
        textContent: price,
      },
      {
        class: 'item_brand',
        textContent: brand,
      },
    ];
    const productInfo = {}; // Создаем объект для хранения информации о товаре

    elements.forEach(({ class: className, textContent }) => {
      const element = document.createElement('div');
      element.classList.add(className);
      element.textContent = textContent;
      itemElement.appendChild(element);

      // Заполняем объект значениями из текущего элемента
      productInfo[className.replace('item_', '')] = textContent;
      // console.log(productInfo);
      // Добавляем слушатель события для поля "Название товара"
      if (className === 'item_product') {
        element.addEventListener('click', () => {
          // Вызываем callback-функцию с информацией о товаре
          filterByName(productInfo.product);
        });
      }
      if (className === 'item_price') {
        element.addEventListener('click', () => {
          // Вызываем callback-функцию с информацией о товаре
          filterByPrice(productInfo.price);
        });
      }
      if (className === 'item_brand') {
        element.addEventListener('click', () => {
          // Вызываем callback-функцию с информацией о товаре
          filterByBrand(productInfo.brand);
        });
      }
    });

    productList.appendChild(itemElement);
  });
}

function pagination(totalPages, currentPage) {
  const ulTag = document.querySelector('ul');
  let liTag = '';
  let activeLi;
  let beforePages = currentPage - 1;
  let afterPages = currentPage + 1;

  if (currentPage > 1) {
    liTag += `<li class="btn prev" onclick="pagination(${totalPages}, ${
      currentPage - 1
    })"><span><i class="fas fa-angle-left"></i>Prev</span></li>`;
  }
  if (currentPage > 2) {
    liTag += `<li class="numb" onclick="pagination(${totalPages}, 1)"><span>1</span></li>`;
    if (currentPage > 3) {
      liTag += `<li class="numb dots"><span>...</span></li>`;
    }
  }

  //how many pages or li show before current li
  if (currentPage == totalPages) {
    beforePages = beforePages - 2;
  } else if (currentPage == 2) {
    afterPages = afterPages + 1;
  }

  //how many pages or li show after current li
  if (currentPage == 1) {
    afterPages = afterPages + 2;
  } else if (currentPage == totalPages - 1) {
    beforePages = beforePages - 1;
  }

  for (let pageLength = beforePages; pageLength <= afterPages; pageLength++) {
    if (pageLength > totalPages) {
      continue;
    }
    if (pageLength == 0) {
      pageLength = pageLength + 1;
    }
    activeLi = currentPage === pageLength ? 'active' : '';
    liTag += `<li class="numb ${activeLi}" onclick="(() => { pagination(${totalPages}, ${pageLength}); getListIds(${pageLength}); })()"><span>${pageLength}</span></li>`;
  }

  if (currentPage < totalPages - 1) {
    if (currentPage < totalPages - 2) {
      liTag += `<li class="numb dots"><span>...</span></li>`;
    }
    liTag += `<li class="numb" onclick="pagination(${totalPages}, ${totalPages})"><span>${totalPages}</span></li>`;
  }

  if (currentPage < totalPages) {
    liTag += `<li class="btn next" onclick="pagination(${totalPages}, ${
      currentPage + 1
    })"><span>Next<i class="fas fa-angle-right"></i></span></li>`;
  }
  ulTag.innerHTML = liTag;
  clearList(productList);
  console.log('вызвана функция очистка листа товара');
}

async function getListIds(page) {
  if (pageCache[page]) {
    // Если страница уже есть в кэше, используем сохраненные данные
    console.log('Данные для страницы', page, 'взяты из кэша');
    getItems(pageCache[page]);
    return;
  }

  let listUniqueIds;
  let data;
  let response;
  do {
    response = await fetch(url, {
      method: 'POST',
      headers: headersApi,
      body: JSON.stringify({
        action: 'get_ids',
        params: { offset: (page - 1) * 50, limit: limit },
      }),
    });
    if (!response.ok) {
      const message = `An error has occured: ${response.status}`;
      console.error(message);
    } else {
      data = await response.json();
      // listUniqueIds = Array.from(new Set(data.result));
      listUniqueIds = data.result;
    }
  } while (!response.ok);
  console.log('Взяты данные для страницы', page, 'с сервера');
  pageCache[page] = listUniqueIds; // Сохраняем данные в кэше
  getItems(listUniqueIds);
  console.log('вызвана функция получения списка товара по ID');
}
//--------------------получаем список товара по ID-----------------
async function getItems(listUniqueIds) {
  if (productCache[listUniqueIds]) {
    // Если товары уже есть в кэше, используем сохраненные данные
    console.log('Данные для товаров взяты из кэша');
    renderProduct(productCache[listUniqueIds]);
    return;
  }
  let response;
  do {
    response = await fetch(url, {
      method: 'POST',
      headers: headersApi,
      body: JSON.stringify({
        action: 'get_items',
        params: { ids: listUniqueIds },
      }),
    });
    if (!response.ok) {
      const message = `An error has occured: ${response.status}`;
      console.error(message);
    } else {
      const data = await response.json();
      console.log('Взяты данные для рендера товара с сервера');
      productCache[listUniqueIds] = data.result;
      const uniqueProducts = removeDuplicates(data.result, 'id');
      renderProduct(uniqueProducts);
      console.log('вызвана функция отображения списка товара по ID');
    }
  } while (!response.ok);
}

//----------------------фильтрация по названию----------------------
async function filterByName(product) {
  let response;
  do {
    response = await fetch(url, {
      method: 'POST',
      headers: headersApi,
      body: JSON.stringify({
        action: 'filter',
        params: { product: product },
      }),
    });

    if (!response.ok) {
      const message = `An error has occurred: ${response.status}`;
      console.error(message);
    } else {
      const data = await response.json();
      const filteredItems = data.result;
      clearList(productList);
      clearList(paginatonList);
      await getItems(filteredItems);
      await removeDuplicates(filteredItems, 'idKey');

      console.log('ID отфильтрованных по назнванию товаров:', filteredItems);
      quantityFilteredProduct = filteredItems.length;
      console.log(
        'Количество отфильтрованных по названию товаров',
        quantityFilteredProduct
      );
    }
  } while (!response.ok);

  totalPagesSortByName = Math.ceil(quantityFilteredProduct / limit); // получаем количество страниц с отсортированным товаром
  // return totalPagesSortByName;
  console.log(
    'Количество страниц отфильтрованных по названию товаров',
    totalPagesSortByName
  );
}
//----------------------фильтрация по цена----------------------
async function filterByPrice(price) {
  let response;
  do {
    response = await fetch(url, {
      method: 'POST',
      headers: headersApi,
      body: JSON.stringify({
        action: 'filter',
        params: { price: price },
      }),
    });

    if (!response.ok) {
      const message = `An error has occurred: ${response.status}`;
      console.error(message);
    } else {
      const data = await response.json();
      const filteredItems = data.result;
      clearList(productList);
      clearList(paginatonList);
      await getItems(filteredItems);
      await removeDuplicates(filteredItems, 'idKey');
      console.log('ID отфильтрованных по цене товаров:', filteredItems);
      quantityFilteredPrice = filteredItems.length;
      console.log(
        'Количество отфильтрованных по цене товаров',
        quantityFilteredPrice
      );
    }
  } while (!response.ok);
  totalPagesSortByPrice = Math.ceil(quantityFilteredPrice / limit); // получаем количество страниц с отсортированным товаром
  // return totalPagesSortByPrice;
  console.log(
    'Количество страниц отфильтрованных по цене товаров',
    totalPagesSortByPrice
  );
}
//----------------------фильтрация по бренду----------------------
async function filterByBrand(brand) {
  let response;
  do {
    response = await fetch(url, {
      method: 'POST',
      headers: headersApi,
      body: JSON.stringify({
        action: 'filter',
        params: { brand: brand },
      }),
    });

    if (!response.ok) {
      const message = `An error has occurred: ${response.status}`;
      console.error(message);
    } else {
      const data = await response.json();
      const filteredItems = data.result;
      clearList(productList);
      clearList(paginatonList);

      await getItems(filteredItems);
      await removeDuplicates(filteredItems, 'idKey');
      console.log('ID отфильтрованных по брэнду товаров:', filteredItems);
      quantityFilteredBrand = filteredItems.length;
      console.log(
        'Количество отфильтрованных по брэнду товаров',
        quantityFilteredBrand
      );
    }
  } while (!response.ok);
  totalPagesSortByBrand = Math.ceil(quantityFilteredBrand / limit); // получаем количество страниц с отсортированным товаром
  // return totalPagesSortByBrand;
  console.log(
    'Количество страниц отфильтрованных по брэнду товаров',
    totalPagesSortByBrand
  );
}

//----------------------получение списка наименований
async function getFieldName() {
  let response;
  do {
    response = await fetch(url, {
      method: 'POST',
      headers: headersApi,
      body: JSON.stringify({
        action: 'get_fields',
        params: { field: 'product' },
      }),
    });
    if (!response.ok) {
      const message = `An error has occured: ${response.status}`;
      console.error(message);
    } else {
      const data = await response.json();
      const productFieldName = data.result;
      clearList(productList);
      clearList(paginatonList);

      console.log(productFieldName);
    }
  } while (!response.ok);
}
// ----------------------получение списка цен
async function getFieldPrice() {
  let response;
  do {
    response = await fetch(url, {
      method: 'POST',
      headers: headersApi,
      body: JSON.stringify({
        action: 'get_fields',
        params: { field: 'price' },
      }),
    });
    if (!response.ok) {
      const message = `An error has occured: ${response.status}`;
      console.error(message);
    } else {
      const data = await response.json();
      const productFieldName = data.result;

      console.log(productFieldName);
    }
  } while (!response.ok);
}
// ----------------------получение списка брендов
async function getFieldBrand() {
  let response;
  do {
    response = await fetch(url, {
      method: 'POST',
      headers: headersApi,
      body: JSON.stringify({
        action: 'get_fields',
        params: { field: 'brand' },
      }),
    });
    if (!response.ok) {
      const message = `An error has occured: ${response.status}`;
      console.error(message);
    } else {
      const data = await response.json();
      const productFieldName = data.result;

      console.log(productFieldName);
    }
  } while (!response.ok);
}
