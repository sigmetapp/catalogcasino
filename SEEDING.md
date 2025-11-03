# Заполнение базы данных (Database Seeding)

Если в вашем приложении нет данных (казино не отображаются), выполните одно из следующих действий:

## Вариант 1: Использование SQL скрипта (Рекомендуется для продакшена)

1. Откройте Supabase Dashboard
2. Перейдите в **SQL Editor**
3. Скопируйте и выполните содержимое файла `seed-demo-casinos.sql`
   - Этот скрипт создаст все таблицы и добавит 5 демо-казино
   - Если таблицы уже существуют, скрипт пропустит их создание
   - Если казино уже существуют, они не будут дублироваться

## Вариант 2: Использование API endpoint

### Проверка статуса базы данных

```bash
curl https://catalogcasino.vercel.app/api/seed
```

### Заполнение данных

Если вы установили `SEED_SECRET_TOKEN` в переменных окружения:

```bash
curl -X POST https://catalogcasino.vercel.app/api/seed \
  -H "Authorization: Bearer YOUR_SEED_SECRET_TOKEN"
```

Если `SEED_SECRET_TOKEN` не установлен, endpoint можно вызвать без авторизации (только для разработки):

```bash
curl -X POST https://catalogcasino.vercel.app/api/seed
```

## Вариант 3: Использование Node.js скрипта (для локальной разработки)

```bash
npm run seed:casinos
```

Убедитесь, что в `.env.local` установлены:
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Что будет добавлено

Скрипт добавит 5 демо-казино:
1. Royal Vegas Casino
2. Betway Casino
3. LeoVegas Casino
4. 888 Casino
5. Casumo Casino

Каждое казино содержит:
- Название и описание
- Логотип (placeholder)
- Бонусную информацию
- Лицензию
- Страну
- Методы оплаты
- Рейтинг и количество отзывов

## Важно

- Скрипты проверяют, существуют ли казино, и не дублируют их
- Безопасно запускать скрипты несколько раз
- Для продакшена рекомендуется использовать SQL скрипт через Supabase Dashboard
