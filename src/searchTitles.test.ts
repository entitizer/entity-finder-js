
import test from 'ava';
import { searchTitles } from './searchTitles';

test('should find titles by short name: R. Moldova -> Republica Moldova', async t => {
    const titles = await searchTitles('R. Moldova', 'ro', { limit: 1 });
    t.is(titles.length, 1, 'one title founded');
    t.is('Republica Moldova', titles[0].title);
});

test('should sort titles by tags', async t => {
    const name = 'Adrian Ursu';
    const titles = await searchTitles(name, 'ro', { limit: 10, tags: 'moldova' });

    t.is(titles.length, 3, '3 titles founded');

    t.is(name, titles[0].simple);
    t.is(titles[0].special, 'cântăreț', 'Adrian Ursu (cântăreț)');
});

test('should (NOT?) find a complex title: Adrian Ursu (cântăreț)', async t => {
    const name = 'Adrian Ursu cântăreț';
    const titles = await searchTitles(name, 'ro', { limit: 10 });

    t.is(titles.length, 1, '1 title founded');

    t.is('Adrian Ursu', titles[0].simple);
    t.is(titles[0].special, 'cântăreț', 'Adrian Ursu (cântăreț)');
});

test('should not find Disambiguation titles: Moldova (dezambiguizare)', async t => {
    const name = 'Moldova (dezambiguizare)';
    const titles = await searchTitles(name, 'ro', { limit: 10 });

    t.is(titles.length, 0, '0 titles founded');
});

test('should find titles by abbreviation: PLDM', async t => {
    const name = 'PLDM';
    const titles = await searchTitles(name, 'ro', { limit: 10 });

    t.is(titles.length, 1, '1 title founded');
    t.is(titles[0].title, 'Partidul Liberal Democrat din Moldova');
});

test('should limit ordered titles by tags', async t => {
    const name = 'Moldova';
    const titles = await searchTitles(name, 'ro', { limit: 10, tags: ['Republica Moldova'], orderByTagsLimit: 1 });

    t.is(titles.length, 10, '10 title founded');
    t.not(titles[0].title, name);
    t.is(titles[1].title, name);
});
