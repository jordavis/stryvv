-- Remove the test helpers so nothing from the test run stays in the database.
begin;
select plan(1);
drop schema tests cascade;
select hasnt_schema('tests', 'test helpers are removed');
select * from finish();
commit;
