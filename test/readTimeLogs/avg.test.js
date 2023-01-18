import { describe, it } from 'node:test';
import assert from 'node:assert';
import avg from '../../src/readTimeLogs/avg.js';

describe('src/avg ', () => {
  it('for two empty arrays return empty map', () => {
    assert.deepEqual(avg([], []), {});
  });

  it('given list of urls returns object with urls as keys', () => {
    assert.deepEqual(
      avg(
        [
          'https://kingoloto.com/subscribe.html',
          'https://bananalotto.fr/subscribe.html',
        ],
        [],
      ),
      {
        'https://kingoloto.com/subscribe.html': null,
        'https://bananalotto.fr/subscribe.html': null,
      },
    );
  });

  it('given list of urls and list of urls and loadTimes returns object with combined list of urls and loadTimes', () => {
    assert.deepEqual(
      avg(
        [
          'https://kingoloto.com/subscribe.html',
          'https://bananalotto.fr/subscribe.html',
        ],
        [
          { url: 'https://kingoloto.com/subscribe.html', loadTime: 1234 },
          { url: 'https://bananalotto.fr/subscribe.html', loadTime: 1234 },
        ],
      ),
      {
        'https://kingoloto.com/subscribe.html': 1234,
        'https://bananalotto.fr/subscribe.html': 1234,
      },
    );
  });

  it('given list of urls and list of urls and loadTimes returns object with combined list of an average loadTime value for urls', () => {
    assert.deepEqual(
      avg(
        [
          'https://kingoloto.com/subscribe.html',
          'https://bananalotto.fr/subscribe.html',
        ],
        [
          { url: 'https://kingoloto.com/subscribe.html', loadTime: 2 },
          { url: 'https://bananalotto.fr/subscribe.html', loadTime: 200 },
          { url: 'https://kingoloto.com/subscribe.html', loadTime: 4 },
          { url: 'https://bananalotto.fr/subscribe.html', loadTime: 200 },
        ],
      ),
      {
        'https://kingoloto.com/subscribe.html': 3,
        'https://bananalotto.fr/subscribe.html': 200,
      },
    );
  });

  it('given list of urls and list of urls and one null loadTime returns object with an average loadTime value for urls', () => {
    assert.deepEqual(
      avg(
        [
          'https://kingoloto.com/subscribe.html',
          'https://bananalotto.fr/subscribe.html',
        ],
        [
          { url: 'https://kingoloto.com/subscribe.html', loadTime: null },
          { url: 'https://bananalotto.fr/subscribe.html', loadTime: 200 },
          { url: 'https://kingoloto.com/subscribe.html', loadTime: 4 },
          { url: 'https://bananalotto.fr/subscribe.html', loadTime: 200 },
        ],
      ),
      {
        'https://kingoloto.com/subscribe.html': 4,
        'https://bananalotto.fr/subscribe.html': 200,
      },
    );
  });

  it('given list of urls and list of urls and loadTime but one missing returns object with combined urls and loadTimes', () => {
    assert.deepEqual(
      avg(
        [
          'https://kingoloto.com/subscribe.html',
          'https://bananalotto.fr/subscribe.html',
        ],
        [{ url: 'https://bananalotto.fr/subscribe.html', loadTime: 1234 }],
      ),
      {
        'https://kingoloto.com/subscribe.html': null,
        'https://bananalotto.fr/subscribe.html': 1234,
      },
    );
  });

  it('given list of urls and empty list of urls and loadTimes returns object with combined urls and null loadTimes', () => {
    assert.deepEqual(avg(['https://kingoloto.com/subscribe.html'], []), {
      'https://kingoloto.com/subscribe.html': null,
    });
  });
});
