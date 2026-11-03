import assert from 'node:assert/strict';
import test from 'node:test';
import { listPage, parseListPaging } from '../server/utils/listPage.ts';
import { parseListSort } from '../server/utils/listSort.ts';

test('пагинация ограничивает размер страницы и обрабатывает неверный ввод', () => {
  assert.deepEqual(parseListPaging({}), { limit: 20, offset: 0 });
  assert.deepEqual(parseListPaging({ limit: '100', offset: '2.9' }), { limit: 50, offset: 2 });
  assert.deepEqual(parseListPaging({ limit: '-5', offset: 'invalid' }), { limit: 20, offset: 0 });
});

test('ответ списка содержит элементы и параметры страницы', () => {
  assert.deepEqual(listPage(['track'], 8, { limit: 5, offset: 2 }), {
    items: ['track'], total: 8, limit: 5, offset: 2,
  });
});

test('сортировка использует подходящий порядок и отклоняет неизвестные значения', () => {
  assert.deepEqual(parseListSort({ sort: 'name' }, 'createdAt'), { sort: 'name', order: 'asc' });
  assert.deepEqual(parseListSort({ sort: 'plays', order: 'asc' }, 'createdAt'), { sort: 'plays', order: 'asc' });
  assert.deepEqual(parseListSort({ sort: 'unknown', order: 'invalid' }, 'createdAt'), { sort: 'createdAt', order: 'desc' });
});
