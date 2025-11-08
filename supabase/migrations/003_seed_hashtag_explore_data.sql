-- Migration 003: Seed hashtag_categories and ready_sets tables with data
-- This migration populates the hashtag explore tables with initial data

-- Insert hashtag categories
INSERT INTO hashtag_categories (name, description) VALUES
('Core Artform', 'Fundamental digital art forms and creative practices'),
('Software & Tools', 'Creative software, tools, and platforms'),
('Aesthetic & Style', 'Artistic styles, aesthetics, and visual movements'),
('Themes & Concepts', 'Creative themes, concepts, and subject matter');

-- Insert hashtags for Core Artform category
INSERT INTO hashtags (name, display_count, size, tags, popularity_score, related_hashtags, category_id) VALUES
('#DigitalArt', '100M+', 'Mega', '{"style"}', 95, '{"#Art", "#Design", "#Creative"}', (SELECT id FROM hashtag_categories WHERE name = 'Core Artform')),
('#GenerativeArt', '1.5M+', 'Large', '{"style", "tool"}', 85, '{"#CreativeCoding", "#AlgorithmicArt", "#Procedural"}', (SELECT id FROM hashtag_categories WHERE name = 'Core Artform')),
('#CreativeCoding', '1.2M+', 'Large', '{"tool", "style"}', 80, '{"#GenerativeArt", "#p5js", "#Processing"}', (SELECT id FROM hashtag_categories WHERE name = 'Core Artform')),
('#Audiovisual', '500k+', 'Medium', '{"style", "audience"}', 70, '{"#VJing", "#AudioReactive", "#Visuals"}', (SELECT id FROM hashtag_categories WHERE name = 'Core Artform')),
('#VJing', '300k+', 'Medium', '{"tool", "style"}', 65, '{"#Audiovisual", "#Resolume", "#LiveVisuals"}', (SELECT id FROM hashtag_categories WHERE name = 'Core Artform')),
('#ProjectionMapping', '400k+', 'Medium', '{"tool", "style"}', 68, '{"#MadMapper", "#Immersive", "#Installation"}', (SELECT id FROM hashtag_categories WHERE name = 'Core Artform')),
('#NewMediaArt', '800k+', 'Large', '{"style"}', 75, '{"#DigitalArt", "#ContemporaryArt", "#Interactive"}', (SELECT id FROM hashtag_categories WHERE name = 'Core Artform')),
('#InteractiveArt', '600k+', 'Medium', '{"style", "audience"}', 72, '{"#NewMediaArt", "#InteractiveInstallation", "#AudienceEngagement"}', (SELECT id FROM hashtag_categories WHERE name = 'Core Artform'));

-- Insert hashtags for Software & Tools category
INSERT INTO hashtags (name, display_count, size, tags, popularity_score, related_hashtags, category_id) VALUES
('#TouchDesigner', '250k+', 'Medium', '{"tool"}', 78, '{"#GenerativeArt", "#VisualProgramming", "#RealTime"}', (SELECT id FROM hashtag_categories WHERE name = 'Software & Tools')),
('#Processing', '400k+', 'Medium', '{"tool"}', 82, '{"#CreativeCoding", "#Java", "#p5js"}', (SELECT id FROM hashtag_categories WHERE name = 'Software & Tools')),
('#p5js', '150k+', 'Small', '{"tool"}', 70, '{"#CreativeCoding", "#JavaScript", "#Processing"}', (SELECT id FROM hashtag_categories WHERE name = 'Software & Tools')),
('#UnrealEngine', '2M+', 'Large', '{"tool"}', 88, '{"#GameDev", "#RealTime", "#3D"}', (SELECT id FROM hashtag_categories WHERE name = 'Software & Tools')),
('#Blender3D', '5M+', 'Large', '{"tool"}', 92, '{"#3DModeling", "#Animation", "#OpenSource"}', (SELECT id FROM hashtag_categories WHERE name = 'Software & Tools')),
('#Resolume', '100k+', 'Small', '{"tool"}', 60, '{"#VJing", "#LiveVisuals", "#Audiovisual"}', (SELECT id FROM hashtag_categories WHERE name = 'Software & Tools')),
('#MadMapper', '50k+', 'Micro', '{"tool"}', 55, '{"#ProjectionMapping", "#Mapping", "#Installation"}', (SELECT id FROM hashtag_categories WHERE name = 'Software & Tools')),
('#AfterEffects', '20M+', 'Mega', '{"tool"}', 96, '{"#MotionGraphics", "#Animation", "#VFX"}', (SELECT id FROM hashtag_categories WHERE name = 'Software & Tools'));

-- Insert hashtags for Aesthetic & Style category
INSERT INTO hashtags (name, display_count, size, tags, popularity_score, related_hashtags, category_id) VALUES
('#GlitchArt', '2M+', 'Large', '{"style"}', 85, '{"#DigitalArt", "#ErrorArt", "#Aesthetic"}', (SELECT id FROM hashtag_categories WHERE name = 'Aesthetic & Style')),
('#Vaporwave', '3M+', 'Large', '{"style"}', 82, '{"#Aesthetic", "#Retro", "#Synthwave"}', (SELECT id FROM hashtag_categories WHERE name = 'Aesthetic & Style')),
('#Cyberpunk', '10M+', 'Mega', '{"style"}', 94, '{"#SciFi", "#Futurism", "#Neon"}', (SELECT id FROM hashtag_categories WHERE name = 'Aesthetic & Style')),
('#AbstractArt', '50M+', 'Mega', '{"style"}', 98, '{"#Art", "#Contemporary", "#ModernArt"}', (SELECT id FROM hashtag_categories WHERE name = 'Aesthetic & Style')),
('#Minimalism', '30M+', 'Mega', '{"style"}', 90, '{"#Design", "#Simple", "#Clean"}', (SELECT id FROM hashtag_categories WHERE name = 'Aesthetic & Style')),
('#Surrealism', '15M+', 'Mega', '{"style"}', 88, '{"#Art", "#Dreamlike", "#Fantasy"}', (SELECT id FROM hashtag_categories WHERE name = 'Aesthetic & Style')),
('#Futurism', '1M+', 'Large', '{"style"}', 75, '{"#Cyberpunk", "#SciFi", "#Innovation"}', (SELECT id FROM hashtag_categories WHERE name = 'Aesthetic & Style')),
('#SciFiArt', '1.8M+', 'Large', '{"style"}', 80, '{"#Cyberpunk", "#Futurism", "#Space"}', (SELECT id FROM hashtag_categories WHERE name = 'Aesthetic & Style'));

-- Insert hashtags for Themes & Concepts category
INSERT INTO hashtags (name, display_count, size, tags, popularity_score, related_hashtags, category_id) VALUES
('#Ethereal', '2M+', 'Large', '{"style", "theme"}', 78, '{"#Dreamy", "#Mystical", "#Atmospheric"}', (SELECT id FROM hashtag_categories WHERE name = 'Themes & Concepts')),
('#Cosmic', '3M+', 'Large', '{"theme"}', 82, '{"#Space", "#Universe", "#Galaxy"}', (SELECT id FROM hashtag_categories WHERE name = 'Themes & Concepts')),
('#LiminalSpace', '400k+', 'Medium', '{"theme"}', 65, '{"#Dreamcore", "#Transitional", "#Empty"}', (SELECT id FROM hashtag_categories WHERE name = 'Themes & Concepts')),
('#SacredGeometry', '1.2M+', 'Large', '{"theme", "style"}', 72, '{"#Patterns", "#Spiritual", "#Mathematics"}', (SELECT id FROM hashtag_categories WHERE name = 'Themes & Concepts')),
('#Mindfulness', '50M+', 'Mega', '{"theme", "audience"}', 95, '{"#Meditation", "#Wellness", "#Peace"}', (SELECT id FROM hashtag_categories WHERE name = 'Themes & Concepts')),
('#Nocturnal', '1M+', 'Large', '{"theme"}', 70, '{"#Night", "#Dark", "#Mystery"}', (SELECT id FROM hashtag_categories WHERE name = 'Themes & Concepts')),
('#Dreamscape', '800k+', 'Large', '{"theme", "style"}', 68, '{"#Dream", "#Fantasy", "#Surreal"}', (SELECT id FROM hashtag_categories WHERE name = 'Themes & Concepts'));

-- Insert ready sets with direct hashtag arrays
INSERT INTO ready_sets (title, description, hashtags, is_favorite, category_id) VALUES
('Cyberpunk VJ Loop Set', 'Perfect for cyberpunk and futuristic VJ content', '{"#Cyberpunk", "#VJing", "#Resolume", "#NeonNoir", "#GlitchArt", "#Futurism", "#MotionGraphics"}', false, (SELECT id FROM hashtag_categories WHERE name = 'Core Artform')),
('Ambient Generative Art', 'Calming generative art and ambient visuals', '{"#GenerativeArt", "#CreativeCoding", "#TouchDesigner", "#AmbientMusic", "#Mindfulness", "#AbstractArt", "#Ethereal"}', false, (SELECT id FROM hashtag_categories WHERE name = 'Core Artform')),
('Interactive Installation Promo', 'Showcase interactive art installations', '{"#InteractiveArt", "#NewMediaArt", "#ProjectionMapping", "#MadMapper", "#ArtInstallation", "#ExperienceDesign", "#ImmersiveArt"}', false, (SELECT id FROM hashtag_categories WHERE name = 'Core Artform'));