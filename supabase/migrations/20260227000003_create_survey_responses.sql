-- survey_responses
-- One row per user (user_id is the PK and upsert conflict target).
-- household_id starts NULL and is backfilled by createHousehold / joinHousehold.
-- Linking both partners' rows to the same household_id is what allows
-- partner data to be queried together for analysis.

create table public.survey_responses (
  user_id                  uuid        primary key references auth.users (id) on delete cascade,
  household_id             uuid        references public.households (id) on delete set null,

  -- Step 1: About you & your relationship
  q5_nickname              text,
  q6_partner_type          text        check (q6_partner_type in ('husband', 'wife')),
  q7_relationship_duration text        check (q7_relationship_duration in (
                                         'less_than_1yr', '1_to_3yr', '4_to_7yr',
                                         '8_to_15yr', '16_to_25yr', '25_plus_yr')),

  -- Step 2: Your financial setup
  q8_finance_structure     text        check (q8_finance_structure in ('fully_joint', 'partially', 'separate')),
  q9_finance_manager       text        check (q9_finance_manager in ('i_do', 'partner', 'share_equally', 'not_defined')),
  q10_satisfaction         smallint    check (q10_satisfaction between 1 and 10),

  -- Step 3: Money mindset
  q11_save_vs_yolo         text,
  q12_my_money_style       text        check (q12_my_money_style in ('avoider', 'optimizer', 'worrier', 'dreamer')),
  q13_partner_money_style  text        check (q13_partner_money_style in ('avoider', 'optimizer', 'worrier', 'dreamer')),
  q14_shape_ranking        text[]      check (array_length(q14_shape_ranking, 1) = 4),
  q15_learning_style       text        check (q15_learning_style in ('visual', 'auditory', 'reading_writing', 'kinesthetic', 'idk')),

  -- Step 4: Goals
  q16_goal_alignment       text        check (q16_goal_alignment in (
                                         'very_aligned', 'mostly_aligned', 'somewhat_aligned',
                                         'rarely_aligned', 'not_at_all')),
  q17_financial_priority   text        check (q17_financial_priority in (
                                         'pay_off_debt', 'build_emergency_fund', 'save_for_home',
                                         'invest_for_retirement', 'grow_wealth', 'save_for_family',
                                         'travel_experiences', 'financial_freedom')),

  -- Step 5: Communication & wins
  q18_favorite_treat       text,
  q19_joy_spending_moment  text,
  q20_discussion_frequency text        check (q20_discussion_frequency in ('weekly', 'monthly', 'occasionally', 'rarely', 'almost_never')),
  q21_conversation_feeling text        check (q21_conversation_feeling in (
                                         'easy_productive', 'somewhat_tense', 'one_sided',
                                         'emotionally_charged', 'we_avoid_them')),
  q22_biggest_challenge    text,
  q23_biggest_win          text,

  -- Step 6: Reflection
  q_reflection_feeling     text        check (q_reflection_feeling in ('very_positive', 'positive', 'neutral', 'uneasy', 'concerned')),
  q_discuss_with_partner   text,
  q_missed_question        text,       -- optional

  -- Metadata
  is_complete              boolean     not null default false,
  completed_at             timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),

  -- is_complete and completed_at must be consistent with each other
  check (
    (is_complete = false and completed_at is null) or
    (is_complete = true  and completed_at is not null)
  )
);

alter table public.survey_responses enable row level security;
