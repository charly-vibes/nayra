const WIKIDATA_PRECISION = {
  YEAR: '9',
  MONTH: '10',
  DAY: '11',
};

function extractQNumber(uri) {
  const match = uri.match(/Q\d+$/);
  return match ? match[0] : null;
}

function getValue(binding, key) {
  return binding[key]?.value;
}

function astronomicalToHistorical(dateStr) {
  const match = dateStr.match(/^(-?\d+)-(\d{2})-(\d{2})/);
  if (!match) return dateStr;

  let year = parseInt(match[1], 10);

  if (year <= 0) {
    const bceYear = 1 - year;
    return `${bceYear} BCE`;
  }

  return `${year}-${match[2]}-${match[3]}`;
}

function simplifyDate(dateStr, precision) {
  if (precision === WIKIDATA_PRECISION.YEAR) {
    const match = dateStr.match(/^(-?\d+)/);
    if (match) {
      const year = parseInt(match[1], 10);
      if (year <= 0) {
        return `${1 - year} BCE`;
      }
      return String(year);
    }
  }
  return astronomicalToHistorical(dateStr);
}

function getPrecisionName(precisionValue) {
  switch (precisionValue) {
    case WIKIDATA_PRECISION.YEAR:
      return 'year';
    case WIKIDATA_PRECISION.MONTH:
      return 'month';
    case WIKIDATA_PRECISION.DAY:
      return 'day';
    default:
      return undefined;
  }
}

function transformBinding(binding) {
  const itemUri = getValue(binding, 'item');
  const label = getValue(binding, 'itemLabel');
  const startTime = getValue(binding, 'startTime');

  if (!itemUri || !label || !startTime) {
    return null;
  }

  const qNumber = extractQNumber(itemUri);
  if (!qNumber) {
    return null;
  }

  const precision = getValue(binding, 'startTimePrecision');
  const start = simplifyDate(startTime, precision);

  const event = {
    id: qNumber,
    label,
    start,
    source: `wikidata:${qNumber}`,
  };

  const endTime = getValue(binding, 'endTime');
  if (endTime) {
    event.end = simplifyDate(endTime, precision);
  }

  const description = getValue(binding, 'itemDescription');
  if (description) {
    event.description = description;
  }

  const category = getValue(binding, 'instanceOf') || getValue(binding, 'instanceOfLabel');
  if (category) {
    event.category = category;
  }

  const url = getValue(binding, 'article');
  if (url) {
    event.url = url;
  }

  if (precision) {
    const precisionName = getPrecisionName(precision);
    if (precisionName) {
      event.precision = precisionName;
    }
  }

  return event;
}

export function transformWikidata(sparqlResult) {
  const bindings = sparqlResult?.results?.bindings || [];

  return bindings
    .map(transformBinding)
    .filter(event => event !== null);
}
