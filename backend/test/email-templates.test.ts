import test from 'node:test';
import assert from 'node:assert/strict';
import { MAIL_LOCALES, normalizeMailLocale, resetEmail, verificationEmail } from '../src/email-templates.js';

test('normalizeMailLocale maps UI locales and falls back to English', () => {
  assert.equal(normalizeMailLocale('pt'), 'pt');
  assert.equal(normalizeMailLocale('pt-PT'), 'pt');
  assert.equal(normalizeMailLocale('zh-cn'), 'zh-CN');
  assert.equal(normalizeMailLocale('xx'), 'en');
  assert.equal(normalizeMailLocale(undefined), 'en');
  assert.equal(normalizeMailLocale(''), 'en');
});

test('every locale produces both mails with the token, email and demo/testnet truth line', () => {
  for (const locale of MAIL_LOCALES) {
    const v = verificationEmail(locale, 'a@b.c', 'blv_tok');
    assert.ok(v.subject.length > 0, locale);
    assert.ok(v.text.includes('a@b.c'), locale);
    assert.ok(v.text.includes('\nblv_tok\n'), locale);
    assert.ok(/demo|démo|demonstração|デモ|데모|演示|示範|التجريبي|डेमो/i.test(v.text), locale + ' keeps demo wording');
    assert.ok(/testnet|テストネット|테스트넷|测试网|測試網|التجريبية|टेस्टनेट/i.test(v.text), locale + ' keeps testnet wording');
    const r = resetEmail(locale, 'a@b.c', 'blr_tok');
    assert.ok(r.subject.length > 0, locale);
    assert.ok(r.text.includes('a@b.c'), locale);
    assert.ok(r.text.includes('\nblr_tok\n'), locale);
    assert.ok(/testnet|テストネット|테스트넷|测试网|測試網|التجريبية|टेस्टनेट/i.test(r.text), locale);
  }
});

test('non-English locales actually translate the verification subject', () => {
  const en = verificationEmail('en', 'a@b.c', 't').subject;
  for (const locale of MAIL_LOCALES) {
    if (locale === 'en') continue;
    assert.notEqual(verificationEmail(locale, 'a@b.c', 't').subject, en, locale);
  }
});
