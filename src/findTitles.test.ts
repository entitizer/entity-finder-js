
import test from 'ava';
import { findTitles } from './findTitles';

test('should filter Disambiguation pages', async t => {
    const name = 'Adrian Ursu';
    const titles = await findTitles(name, 'ro', { limit: 10 });
    const specialNames = ['cântăreț', 'jurnalist'];

    t.is(titles.length, 2, '2 titles founded');

    t.is(name, titles[0].simple);
    t.true(specialNames.indexOf(titles[0].special) > -1, 'has a special name');

    t.is(name, titles[1].simple);
    t.true(specialNames.indexOf(titles[1].special) > -1, 'has a special name');
});

test('ru', async t => {
    const name = 'ЦК';
    const titles = await findTitles(name, 'ru', { limit: 10 });

    // console.log(titles)
    t.is(titles.length, 10, '10 titles founded');
});
