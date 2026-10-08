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
docker exec -i dasturxon-db-validation psql -U postgres -v ON_ERROR_STOP=1 < tests/database/security.sql
docker stop dasturxon-db-validation
```

Проверяются права гостя, обычного пользователя и администратора; запрет самоназначения прав;
публичность только опубликованных данных; скрытые/архивные блюда и категории;
приватность изображений; связность restaurant/category; цены, переводы и постоянные slug.
После выполнения база содержит тестовые данные. Контейнер удаляется при остановке.
