-- Credits System Migration
-- This migration creates tables for the credits and gamification system

-- Create user_game_state table
CREATE TABLE IF NOT EXISTS user_game_state (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    credits INTEGER NOT NULL DEFAULT 100,
    xp INTEGER NOT NULL DEFAULT 0,
    level INTEGER NOT NULL DEFAULT 1,
    achievements JSONB DEFAULT '[]'::jsonb,
    daily_streak INTEGER NOT NULL DEFAULT 0,
    last_daily_bonus DATE,
    total_earned INTEGER NOT NULL DEFAULT 100,
    total_spent INTEGER NOT NULL DEFAULT 0,
    total_purchased INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create credit_transactions table
CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('earned', 'spent', 'purchased', 'bonus', 'refund')),
    description TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at DESC);
CREATE INDEX idx_credit_transactions_type ON credit_transactions(type);

-- Create RLS (Row Level Security) policies
ALTER TABLE user_game_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- User can only read their own game state
CREATE POLICY "Users can view own game state" ON user_game_state
    FOR SELECT USING (auth.uid() = user_id);

-- User can update their own game state
CREATE POLICY "Users can update own game state" ON user_game_state
    FOR UPDATE USING (auth.uid() = user_id);

-- User can insert their own game state (first time)
CREATE POLICY "Users can insert own game state" ON user_game_state
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User can only read their own transactions
CREATE POLICY "Users can view own transactions" ON credit_transactions
    FOR SELECT USING (auth.uid() = user_id);

-- User can insert their own transactions
CREATE POLICY "Users can insert own transactions" ON credit_transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_game_state_updated_at BEFORE UPDATE ON user_game_state
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to initialize user game state when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user_credits()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.user_game_state (user_id, credits, xp, level, total_earned)
    VALUES (new.id, 100, 0, 1, 100);
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create game state for new users
CREATE TRIGGER on_auth_user_created_credits
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_credits();

-- Create a view for leaderboard (optional)
CREATE OR REPLACE VIEW public.leaderboard AS
SELECT
    user_id,
    level,
    xp,
    credits,
    daily_streak,
    ROW_NUMBER() OVER (ORDER BY xp DESC) as rank
FROM user_game_state
ORDER BY xp DESC
LIMIT 100;

-- Grant permissions for the view
GRANT SELECT ON public.leaderboard TO authenticated;

-- Function to claim daily bonus
CREATE OR REPLACE FUNCTION public.claim_daily_bonus(user_id_input UUID)
RETURNS INTEGER AS $$
DECLARE
    last_bonus DATE;
    current_streak INTEGER;
    bonus_amount INTEGER;
    yesterday DATE;
BEGIN
    -- Get user's last bonus date and streak
    SELECT last_daily_bonus, daily_streak INTO last_bonus, current_streak
    FROM user_game_state
    WHERE user_id = user_id_input;

    -- Check if already claimed today
    IF last_bonus = CURRENT_DATE THEN
        RETURN 0;
    END IF;

    yesterday := CURRENT_DATE - INTERVAL '1 day';

    -- Calculate new streak
    IF last_bonus = yesterday THEN
        current_streak := current_streak + 1;
    ELSE
        current_streak := 1;
    END IF;

    -- Calculate bonus amount (base + streak bonus)
    bonus_amount := 100 + LEAST(current_streak * 10, 400) + floor(random() * 100);

    -- Update user game state
    UPDATE user_game_state
    SET
        credits = credits + bonus_amount,
        total_earned = total_earned + bonus_amount,
        daily_streak = current_streak,
        last_daily_bonus = CURRENT_DATE,
        updated_at = NOW()
    WHERE user_id = user_id_input;

    -- Record transaction
    INSERT INTO credit_transactions (user_id, amount, type, description, metadata)
    VALUES (
        user_id_input,
        bonus_amount,
        'bonus',
        format('Daily bonus (Day %s streak)', current_streak),
        jsonb_build_object('streak', current_streak)
    );

    RETURN bonus_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to spend credits
CREATE OR REPLACE FUNCTION public.spend_credits(
    user_id_input UUID,
    amount_input INTEGER,
    description_input TEXT,
    feature_input TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    current_credits INTEGER;
BEGIN
    -- Get current credits
    SELECT credits INTO current_credits
    FROM user_game_state
    WHERE user_id = user_id_input;

    -- Check if user has enough credits
    IF current_credits < amount_input THEN
        RETURN FALSE;
    END IF;

    -- Update credits
    UPDATE user_game_state
    SET
        credits = credits - amount_input,
        total_spent = total_spent + amount_input,
        updated_at = NOW()
    WHERE user_id = user_id_input;

    -- Record transaction
    INSERT INTO credit_transactions (user_id, amount, type, description, metadata)
    VALUES (
        user_id_input,
        -amount_input,
        'spent',
        description_input,
        CASE
            WHEN feature_input IS NOT NULL
            THEN jsonb_build_object('feature', feature_input)
            ELSE NULL
        END
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add XP and check for level up
CREATE OR REPLACE FUNCTION public.add_xp(
    user_id_input UUID,
    xp_amount INTEGER,
    source_input TEXT
)
RETURNS TABLE(new_level INTEGER, level_up BOOLEAN) AS $$
DECLARE
    current_xp INTEGER;
    current_level INTEGER;
    new_xp INTEGER;
    new_level_calc INTEGER;
    did_level_up BOOLEAN;
BEGIN
    -- Get current XP and level
    SELECT xp, level INTO current_xp, current_level
    FROM user_game_state
    WHERE user_id = user_id_input;

    -- Calculate new XP and level
    new_xp := current_xp + xp_amount;
    new_level_calc := floor(new_xp / 1000) + 1;
    did_level_up := new_level_calc > current_level;

    -- Update user game state
    UPDATE user_game_state
    SET
        xp = new_xp,
        level = new_level_calc,
        updated_at = NOW()
    WHERE user_id = user_id_input;

    -- If leveled up, award bonus credits
    IF did_level_up THEN
        UPDATE user_game_state
        SET
            credits = credits + (new_level_calc * 100),
            total_earned = total_earned + (new_level_calc * 100)
        WHERE user_id = user_id_input;

        -- Record level up bonus transaction
        INSERT INTO credit_transactions (user_id, amount, type, description, metadata)
        VALUES (
            user_id_input,
            new_level_calc * 100,
            'bonus',
            format('Level %s bonus!', new_level_calc),
            jsonb_build_object('level', new_level_calc, 'source', source_input)
        );
    END IF;

    RETURN QUERY SELECT new_level_calc, did_level_up;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;