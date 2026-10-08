# Локальная проверка SQL

Для теста нужен отдельный пустой PostgreSQL 17, не рабочая база Supabase.
`bootstrap.sql` создаёт минимальные тестовые аналоги схем Auth и Storage.
Он проверяет политики PostgreSQL, но не подменяет проверку настоящих Supabase Auth/Storage API.

Запуск через Docker (в команде задайте временный пароль только для тестового контейнера):

```bash
docker run --detach --rm --name dasturxon-db-validation --env POSTGRES_PASSWORD=local-test-only postgres:17
# Дождитесь готовности: docker exec dasturxon-db-validation pg_isready -U postgres
docker exec -i dasturxon-db-validation psql -U postgres -v ON_ERROR_STOP=1 < tests/database/bootstrap.sql
docker exec -i dasturxon-db-validation psql -U postgres -v ON_ERROR_STOP=1 < supabase/migrations/202610090001_initial_schema.sql
docker exec -i dasturxon-db-validation psql -U postgres -v ON_ERROR_STOP=1 < supabase/migrations/202610090002_editors_and_settings.sql
docker exec -i dasturxon-db-validation psql -U postgres -v ON_ERROR_STOP=1 < tests/database/security.sql
docker exec -i dasturxon-db-validation psql -U postgres -v ON_ERROR_STOP=1 < tests/database/editors.sql
docker stop dasturxon-db-validation
```

Проверяются права гостя, обычного пользователя и администратора; запрет самоназначения прав;
публичность только опубликованных данных; скрытые/архивные блюда и категории;
приватность изображений; связность restaurant/category; цены, переводы и постоянные slug.
После выполнения база содержит тестовые данные. Контейнер удаляется при остановке.

## Браузерная проверка редакторов с PostgREST

Только отдельная локальная тестовая база; рабочий проект Supabase не используется.
Нужны Docker, Chromium и выполненная `npm run build`. Пример запуска с нуля:

```bash
docker network create dasturxon-editor-test
docker run --detach --rm --network dasturxon-editor-test --name dasturxon-editor-db --env POSTGRES_PASSWORD=local-test-only postgres:17
# Дождитесь готовности: docker exec dasturxon-editor-db pg_isready -U postgres
docker exec -i dasturxon-editor-db psql -U postgres -v ON_ERROR_STOP=1 < tests/database/bootstrap.sql
docker exec -i dasturxon-editor-db psql -U postgres -v ON_ERROR_STOP=1 < supabase/migrations/202610090001_initial_schema.sql
docker exec -i dasturxon-editor-db psql -U postgres -v ON_ERROR_STOP=1 < supabase/migrations/202610090002_editors_and_settings.sql
docker exec -i dasturxon-editor-db psql -U postgres -v ON_ERROR_STOP=1 < tests/database/security.sql
docker exec dasturxon-editor-db psql -U postgres -v ON_ERROR_STOP=1 -c "create role authenticator login noinherit password 'local-test-only'; grant anon,authenticated to authenticator;"
docker run --detach --rm --network dasturxon-editor-test --name dasturxon-editor-api -p 127.0.0.1:54325:3000 --env PGRST_DB_URI=postgres://authenticator:local-test-only@dasturxon-editor-db:5432/postgres --env PGRST_DB_SCHEMAS=public,storage --env PGRST_DB_ANON_ROLE=anon --env PGRST_JWT_SECRET=local-postgrest-validation-secret-at-least-32 postgrest/postgrest:v12.2.3
# Дождитесь успешного ответа: curl http://127.0.0.1:54325/restaurants
npx playwright install chromium
npm run test:editors
# Если Chromium установлен в системе, вместо предыдущих двух строк:
# CHROMIUM_PATH=/usr/bin/chromium npm run test:editors
docker stop dasturxon-editor-api dasturxon-editor-db
docker network rm dasturxon-editor-test
```

Тест сам запускает production Next.js на отдельном порту 3112. CRUD, RPC и RLS
выполняются настоящими PostgreSQL/PostgREST; HTTP Auth и передача файлов —
локальными тестовыми адаптерами. Проверяются создание и изменение меню,
оптимизация фотографии, публикация/снятие публикации, скрытие блюда и изображения,
контакты, недоступность черновиков документов, сохранение формы при ошибке
и отсутствие горизонтального прокручивания редакторов. Это не проверка hosted Supabase.
