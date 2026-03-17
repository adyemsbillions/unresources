<?php
// index.php - Full dynamic homepage with nested navigation (dropdown/submenu support)
// Last updated: Hero changed to wide banner style with dynamic text from backend
include 'db.php'; // Your PDO database connection file

// ────────────────────────────────────────────────
// Fetch all dynamic content sections
// ────────────────────────────────────────────────
// Hero
$hero_stmt = $pdo->prepare("SELECT * FROM hero_section WHERE id = 1");
$hero_stmt->execute();
$hero = $hero_stmt->fetch(PDO::FETCH_ASSOC);
// Flash Appeal
$flash_stmt = $pdo->prepare("SELECT * FROM flash_appeal WHERE id = 1");
$flash_stmt->execute();
$flash = $flash_stmt->fetch(PDO::FETCH_ASSOC);
// Who We Are
$who_stmt = $pdo->prepare("SELECT * FROM who_we_are WHERE id = 1");
$who_stmt->execute();
$who = $who_stmt->fetch(PDO::FETCH_ASSOC);
// News
$news_stmt = $pdo->prepare("SELECT * FROM news_items ORDER BY id ASC");
$news_stmt->execute();
$news_items = $news_stmt->fetchAll(PDO::FETCH_ASSOC);
// Navigation (with parent_id support)
$nav_stmt = $pdo->prepare("
    SELECT * FROM nav_items
    ORDER BY parent_id ASC, order_num ASC, id ASC
");
$nav_stmt->execute();
$nav_items = $nav_stmt->fetchAll(PDO::FETCH_ASSOC);
// Social icons
$social_stmt = $pdo->prepare("SELECT * FROM social_icons ORDER BY order_num ASC");
$social_stmt->execute();
$social_icons = $social_stmt->fetchAll(PDO::FETCH_ASSOC);
// Footer sections + their links
$footer_sections_stmt = $pdo->prepare("SELECT * FROM footer_sections ORDER BY id ASC");
$footer_sections_stmt->execute();
$footer_sections = $footer_sections_stmt->fetchAll(PDO::FETCH_ASSOC);
$footer_links = [];
foreach ($footer_sections as $section) {
    $links_stmt = $pdo->prepare("
        SELECT * FROM footer_links
        WHERE section_id = :section_id
        ORDER BY order_num ASC
    ");
    $links_stmt->execute(['section_id' => $section['id']]);
    $footer_links[$section['id']] = $links_stmt->fetchAll(PDO::FETCH_ASSOC);
}

// ────────────────────────────────────────────────
// Recursive navigation renderer (used for both desktop and mobile)
// ────────────────────────────────────────────────
function render_nav_items(array $items, int $parent_id = 0, int $level = 0, bool $is_mobile = false): string {
    $output = '';
    $current_level_items = array_filter($items, function($item) use ($parent_id) {
        return (int)$item['parent_id'] === $parent_id;
    });
    if (empty($current_level_items)) return '';
    if ($level === 0) {
        $output .= $is_mobile ? '<ul class="mobile-nav-list">' : '<ul class="main-nav">';
    } else {
        $output .= '<ul class="dropdown-menu">';
    }
    foreach ($current_level_items as $item) {
        $has_children = false;
        foreach ($items as $child) {
            if ((int)$child['parent_id'] === (int)$item['id']) {
                $has_children = true;
                break;
            }
        }
        $li_classes = [];
        if ($has_children) $li_classes[] = 'has-dropdown';
        if (!empty($item['class'])) $li_classes[] = $item['class'];
        $li_class_str = !empty($li_classes) ? ' class="' . implode(' ', $li_classes) . '"' : '';
        $is_donate = strpos($item['class'] ?? '', 'donate') !== false;
        $output .= "<li$li_class_str>";
        $output .= '<a href="' . htmlspecialchars($item['link_url']) . '"';
        if ($is_donate && !$is_mobile) $output .= ' class="donate-btn"';
        if ($is_donate && $is_mobile) $output .= ' class="mobile-donate-btn"';
        $output .= '>';
        if ($is_mobile && $level > 0) $output .= '<span class="mobile-sub-indent">—</span>';
        $output .= htmlspecialchars($item['label']);
        if ($has_children && !$is_mobile) $output .= '<svg class="chevron" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>';
        $output .= '</a>';
        if ($has_children) {
            $output .= render_nav_items($items, (int)$item['id'], $level + 1, $is_mobile);
        }
        $output .= '</li>';
    }
    $output .= '</ul>';
    return $output;
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>FRI - First-Line Relief Initiative</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
    <link rel="icon" type="image/png" href="logo.png">
    
    <link rel="apple-touch-icon" href="logo.png">
    <style>
        * { margin:0; padding:0; box-sizing:border-box; }
        body { font-family: 'Barlow', system-ui, -apple-system, sans-serif; color:#333; line-height:1.6; }

        /* Header, nav, dropdown, mobile menu styles (unchanged) */
        header { background:#fff; position:sticky; top:0; z-index:1000; border-bottom:1px solid rgba(0,0,0,0.07); box-shadow:0 1px 20px rgba(0,0,0,0.06); }
        .header-container { max-width:1400px; margin:0 auto; padding:0 28px; display:flex; justify-content:space-between; align-items:center; height:86px; }
        .logo img { height:50px; width:auto; }
        .main-nav { display:flex; align-items:center; gap:4px; list-style:none; }
        .main-nav > li { position:relative; }
        .main-nav > li > a { display:flex; align-items:center; gap:5px; color:#555; text-decoration:none; font-size:14.5px; font-weight:500; padding:8px 13px; border-radius:6px; transition:color 0.2s, background 0.2s; white-space:nowrap; }
        .main-nav > li > a:hover { color:#6590FF; background:rgba(101,144,255,0.07); }
        .chevron { width:9px; height:6px; stroke:currentColor; transition:transform 0.25s; flex-shrink:0; opacity:0.7; }
        .main-nav > li.has-dropdown:hover > a .chevron { transform:rotate(180deg); }
        .main-nav a.donate-btn { background:transparent; color:#E07B39 !important; padding:8px 18px !important; border:1.5px solid #E07B39; font-weight:600; text-transform:uppercase; letter-spacing:0.8px; font-size:13px; border-radius:6px; transition:background 0.2s, color 0.2s; }
        .main-nav a.donate-btn:hover { background:#E07B39; color:white !important; }
        .dropdown-menu { display:block; visibility:hidden; opacity:0; pointer-events:none; position:absolute; top:calc(100% + 10px); left:50%; transform:translateX(-50%) translateY(-6px); background:#fff; min-width:210px; border-radius:10px; box-shadow:0 8px 32px rgba(0,0,0,0.13), 0 0 0 1px rgba(0,0,0,0.05); padding:6px; list-style:none; transition:opacity 0.2s, transform 0.2s, visibility 0.2s; z-index:1200; }
        .dropdown-menu::before { content:''; position:absolute; top:-6px; left:50%; transform:translateX(-50%); width:12px; height:6px; background:#fff; clip-path:polygon(50% 0%, 0% 100%, 100% 100%); }
        .has-dropdown:hover > .dropdown-menu { visibility:visible; opacity:1; pointer-events:auto; transform:translateX(-50%) translateY(0); }
        .dropdown-menu li { position:relative; }
        .dropdown-menu a { display:flex; align-items:center; padding:9px 13px; color:#444; text-decoration:none; font-size:14px; font-weight:500; border-radius:6px; transition:background 0.15s, color 0.15s; white-space:nowrap; }
        .dropdown-menu a:hover { background:rgba(101,144,255,0.08); color:#6590FF; }
        .dropdown-menu .dropdown-menu { top:0; left:calc(100% + 6px); transform:translateX(0) translateY(-6px); }
        .dropdown-menu .dropdown-menu::before { display:none; }
        .dropdown-menu .has-dropdown:hover > .dropdown-menu { transform:translateX(0) translateY(0); }
        .social-icons { display:flex; gap:18px; }
        .social-icons a { color:#ccc; font-size:20px; transition:color 0.25s, transform 0.2s; display:flex; align-items:center; }
        .social-icons a:hover { color:#6590FF; transform:translateY(-1px); }
        .hamburger { display:none; width:36px; height:36px; border-radius:6px; background:rgba(101,144,255,0.08); border:none; cursor:pointer; align-items:center; justify-content:center; flex-direction:column; gap:4.5px; padding:0; transition:background 0.2s; }
        .hamburger:hover { background:rgba(101,144,255,0.15); }
        .hamburger span { display:block; width:18px; height:2px; background:#6590FF; border-radius:2px; transition:all 0.3s; }
        .hamburger.open span:nth-child(1) { transform:translateY(6.5px) rotate(45deg); }
        .hamburger.open span:nth-child(2) { opacity:0; transform:scaleX(0); }
        .hamburger.open span:nth-child(3) { transform:translateY(-6.5px) rotate(-45deg); }
        .mobile-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.35); backdrop-filter:blur(2px); z-index:1090; opacity:0; pointer-events:none; transition:opacity 0.3s; }
        .mobile-overlay.active { opacity:1; pointer-events:auto; }
        .mobile-menu { position:fixed; top:0; right:-100%; width:80%; max-width:340px; height:100%; background:white; box-shadow:-3px 0 20px rgba(0,0,0,0.25); transition:right 0.35s cubic-bezier(0.4,0,0.2,1); z-index:1100; display:flex; flex-direction:column; overflow:hidden; }
        .mobile-menu.active { right:0; }
        .mobile-menu-header { display:flex; align-items:center; justify-content:space-between; padding:18px 22px; border-bottom:1px solid #f0f0f0; flex-shrink:0; }
        .mobile-menu-header img { height:36px; }
        .mobile-close { width:34px; height:34px; border-radius:50%; background:#f5f5f5; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:18px; color:#666; transition:background 0.2s; }
        .mobile-close:hover { background:#eee; }
        .mobile-menu-body { flex:1; overflow-y:auto; padding:10px 10px 20px; }
        .mobile-nav-list { list-style:none; }
        .mobile-nav-list > li > a { display:flex; align-items:center; padding:12px 12px; color:#333; text-decoration:none; font-size:16px; font-weight:500; border-radius:8px; transition:background 0.15s, color 0.15s; }
        .mobile-nav-list > li > a:hover { background:rgba(101,144,255,0.07); color:#6590FF; }
        .mobile-nav-list .dropdown-menu { display:block; visibility:visible; opacity:1; pointer-events:auto; position:static; transform:none; box-shadow:none; background:transparent; border-radius:0; padding:0; margin-left:16px; border-left:2px solid #eee; padding-left:6px; margin-bottom:4px; }
        .mobile-nav-list .dropdown-menu::before { display:none; }
        .mobile-nav-list .dropdown-menu a { padding:9px 12px; font-size:14.5px; color:#555; font-weight:400; border-radius:6px; }
        .mobile-nav-list .dropdown-menu a:hover { color:#6590FF; background:rgba(101,144,255,0.06); }
        .mobile-sub-indent { margin-right:6px; color:#ccc; font-size:12px; }
        .mobile-donate-btn { display:block; text-align:center; background:#E07B39; color:white !important; padding:12px 20px; border-radius:8px; font-weight:600; text-decoration:none; text-transform:uppercase; letter-spacing:0.8px; font-size:14px; margin:4px 0; transition:background 0.2s; }
        .mobile-donate-btn:hover { background:#c96a2a; }
        .mobile-menu-footer { padding:18px 22px; border-top:1px solid #f0f0f0; flex-shrink:0; }
        .mobile-menu-footer .social-icons { justify-content:center; gap:22px; }
        .mobile-menu-footer .social-icons a { font-size:20px; }
        @media (max-width:900px) { .main-nav { display:none; } .hamburger { display:flex; } }

        /* ── HERO – wide banner style matching your screenshot ── */
        .hero {
            position: relative;
            height: 680px;
            min-height: 65vh;
            overflow: hidden;
        }
        .hero-images {
            position: absolute;
            inset: 0;
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: 1fr 1fr;
        }
        .hero-image {
            background-size: cover;
            background-position: center;
        }
        .hero-banner {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 80%;
            max-width: 1180px;
            background: rgba(255,255,255,0.94);
            backdrop-filter: blur(5px);
            border-radius: 0px;
            padding: 12px 28px;
            box-shadow: 0 12px 48px rgba(0,0,0,0.28);
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-left: 10px solid #E07B39;
        }
        .hero-banner h1 {
            color: #003366;
            font-size: clamp(14px, 5.5vw, 30px);
            font-weight: 700;
            line-height: 1.2;
            margin: 0;
            flex: 1;
            min-width: 340px;
        }
        .donate-banner-btn {
            background: #0066cc;
            color: white;
            font-size: 14px;
            font-weight: 700;
            padding: 7px 28px;
            border-radius: 8px;
            text-decoration: none;
            text-transform: uppercase;
            letter-spacing: 1.1px;
            white-space: nowrap;
            transition: all 0.25s;
            box-shadow: 0 5px 16px rgba(0,102,204,0.35);
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .donate-banner-btn:hover {
            background: #0055aa;
            transform: translateY(-3px);
            box-shadow: 0 10px 28px rgba(0,102,204,0.45);
        }
        .donate-banner-btn span {
            font-size: 24px;
            font-weight: bold;
        }
        .play-button {
            position: absolute;
            bottom: 12%;
            left: 50%;
            transform: translateX(-50%);
            width: 80px;
            height: 80px;
            background: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 6px 24px rgba(0,0,0,0.35);
            z-index: 15;
            font-size: 28px;
            color: #6590FF;
        }

        /* Mobile – stack banner vertically */
        @media (max-width: 900px) {
            .hero { height: auto; min-height: 80vh; padding: 100px 0 80px; }
            .hero-banner {
                position: relative;
                top: auto; left: auto; transform: none;
                margin: 0 20px;
                padding: 40px 30px;
                flex-direction: column;
                text-align: center;
                gap: 35px;
            }
            .hero-banner h1 { font-size: clamp(30px, 7vw, 42px); min-width: auto; }
            .donate-banner-btn { padding: 16px 44px; font-size: 17px; }
        }

        /* Flash Appeal, Who We Are, News, Footer, Responsive – unchanged */
        .flash-appeal { background:linear-gradient(135deg, #E07B39 0%, #000 100%); padding:60px 20px; }
        .flash-appeal-content { max-width:1200px; margin:0 auto; background:white; padding:40px; display:grid; grid-template-columns:1fr 1.2fr; gap:40px; align-items:center; }
        .flash-appeal-text h2 { color:#6590FF; font-size:clamp(28px,5.5vw,38px); margin-bottom:20px; }
        .flash-appeal-text p { color:#666; font-size:16px; margin-bottom:30px; line-height:1.8; }
        .flash-appeal-btn { background:#6590FF; color:white; padding:15px 35px; text-decoration:none; font-weight:600; text-transform:uppercase; letter-spacing:1.2px; display:inline-block; transition:all 0.3s; border-radius:4px; }
        .flash-appeal-btn:hover { background:#4a6cd1; transform:translateX(4px); }
        .flash-appeal-image { height:320px; background-size:cover; background-position:center; border-radius:8px; }
        .who-we-are { padding:80px 20px; background:white; }
        .who-container { max-width:1200px; margin:0 auto; display:grid; grid-template-columns:1fr 1fr; gap:60px; align-items:center; }
        .who-image { height:480px; background-size:cover; background-position:center; border-radius:8px; }
        .who-content h2 { color:#6590FF; font-size:clamp(36px,7vw,48px); font-weight:400; margin-bottom:35px; letter-spacing:6px; text-transform:uppercase; }
        .who-content p { color:#555; font-size:17px; line-height:1.9; margin-bottom:35px; }
        .learn-more-btn { color:#6590FF; text-decoration:none; font-weight:600; text-transform:uppercase; letter-spacing:1.8px; font-size:15px; transition:all 0.3s; display:inline-block; }
        .learn-more-btn:hover { transform:translateX(6px); }
        .latest-news { padding:80px 20px; background:#f8f8f8; }
        .news-container { max-width:1200px; margin:0 auto; }
        .news-container h2 { text-align:center; color:#555; font-size:clamp(26px,5vw,32px); margin-bottom:50px; letter-spacing:5px; text-transform:uppercase; }
        .news-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(320px,1fr)); gap:35px; margin-bottom:50px; }
        .news-card { background:white; overflow:hidden; border-radius:8px; box-shadow:0 4px 12px rgba(0,0,0,0.08); transition:transform 0.3s, box-shadow 0.3s; }
        .news-card:hover { transform:translateY(-6px); box-shadow:0 12px 30px rgba(0,0,0,0.12); }
        .news-image { height:220px; background-size:cover; background-position:center; }
        .news-content { padding:25px; }
        .news-meta { display:flex; justify-content:space-between; font-size:13px; color:#6590FF; text-transform:uppercase; margin-bottom:12px; }
        .news-content h3 { font-size:21px; line-height:1.35; margin-bottom:12px; }
        .see-all-btn { display:block; width:fit-content; margin:0 auto; padding:14px 38px; border:2px solid #666; color:#666; text-decoration:none; text-transform:uppercase; letter-spacing:1.5px; font-weight:600; border-radius:4px; transition:all 0.3s; }
        .see-all-btn:hover { background:#666; color:white; }
        footer { background:#6590FF; color:white; padding:70px 20px 30px; }
        .footer-container { max-width:1200px; margin:0 auto; }
        .footer-content { display:grid; grid-template-columns:repeat(auto-fit, minmax(220px,1fr)); gap:40px; margin-bottom:40px; }
        .footer-section h3 { font-size:18px; margin-bottom:20px; font-weight:600; }
        .footer-section ul { list-style:none; }
        .footer-section a { color:rgba(255,255,255,0.85); text-decoration:none; font-size:15px; line-height:2; transition:color 0.3s; }
        .footer-section a:hover { color:white; }
        .footer-bottom { border-top:1px solid rgba(255,255,255,0.18); padding-top:30px; text-align:center; font-size:14px; color:rgba(255,255,255,0.7); }

        /* Responsive */
        @media (max-width:1024px) { .hero { height:640px; } }
        @media (max-width:768px) {
            .hero { min-height:100vh; height:auto; padding:100px 0 80px; background:#6590FF; }
            .flash-appeal-content, .who-container { grid-template-columns:1fr; }
            .flash-appeal-image { height:280px; }
            .who-image { height:400px; }
        }
        @media (max-width:480px) {
            .header-container { padding:0 15px; }
            .news-image { height:200px; }
        }
    </style>
</head>
<body>

    <!-- Header -->
    <header>
        <div class="header-container">
<a href="index.php" class="logo">
    <img src="logo.png" alt="FLRI Logo" width="40px" height="40px">
</a>
              
            </a>
            <nav class="main-nav">
                <?php echo render_nav_items($nav_items, 0, 0, false); ?>
            </nav>
            <div class="social-icons">
                <?php foreach ($social_icons as $icon): ?>
                    <a href="<?php echo htmlspecialchars($icon['link_url'] ?? '#'); ?>" target="_blank" rel="noopener">
                        <i class="<?php echo htmlspecialchars($icon['icon_class'] ?? 'fab fa-question'); ?>"></i>
                    </a>
                <?php endforeach; ?>
            </div>
            <button class="hamburger" id="hamburger" aria-label="Open menu" aria-expanded="false">
                <span></span>
                <span></span>
                <span></span>
            </button>
        </div>
    </header>

    <!-- Mobile Overlay -->
    <div class="mobile-overlay" id="mobileOverlay"></div>

    <!-- Mobile Menu -->
    <div class="mobile-menu" id="mobileMenu">
        <div class="mobile-menu-header">
            <img src="logo.png" alt="FRI Logo">
            <button class="mobile-close" id="closeMenu" aria-label="Close menu">✕</button>
        </div>
        <div class="mobile-menu-body">
            <?php echo render_nav_items($nav_items, 0, 0, true); ?>
        </div>
        <div class="mobile-menu-footer">
            <div class="social-icons">
                <?php foreach ($social_icons as $icon): ?>
                    <a href="<?php echo htmlspecialchars($icon['link_url'] ?? '#'); ?>" target="_blank" rel="noopener">
                        <i class="<?php echo htmlspecialchars($icon['icon_class'] ?? 'fab fa-question'); ?>"></i>
                    </a>
                <?php endforeach; ?>
            </div>
        </div>
    </div>

    <!-- Hero – wide banner style with dynamic backend text -->
    <section class="hero">
        <div class="hero-images">
            <div class="hero-image" style="background-image: linear-gradient(rgba(101,144,255,0.75), rgba(101,144,255,0.75)), url('<?php echo htmlspecialchars($hero['image1'] ?? ''); ?>');"></div>
            <div class="hero-image" style="background-image: url('<?php echo htmlspecialchars($hero['image2'] ?? ''); ?>');"></div>
            <div class="hero-image" style="background-image: url('<?php echo htmlspecialchars($hero['image3'] ?? ''); ?>');"></div>
            <div class="hero-image" style="background-image: url('<?php echo htmlspecialchars($hero['image4'] ?? ''); ?>');"></div>
        </div>

        <div class="hero-banner">
            <h1><?php echo htmlspecialchars($hero['title'] ?? ''); ?></h1>
            <a href="<?php echo htmlspecialchars($hero['cta_link'] ?? '#'); ?>" class="donate-banner-btn">
                <?php echo htmlspecialchars($hero['cta_text'] ?? 'DONATE TODAY'); ?> <span>→</span>
            </a>
        </div>

        <div class="play-button">▶</div>
    </section>

    <!-- Flash Appeal -->
    <section class="flash-appeal">
        <div class="flash-appeal-content">
            <div class="flash-appeal-text">
                <h2><?php echo htmlspecialchars($flash['title'] ?? ''); ?></h2>
                <p><?php echo htmlspecialchars($flash['description'] ?? ''); ?></p>
                <a href="<?php echo htmlspecialchars($flash['btn_link'] ?? '#'); ?>" class="flash-appeal-btn">
                    <?php echo htmlspecialchars($flash['btn_text'] ?? 'Support Now'); ?>
                </a>
            </div>
            <div class="flash-appeal-image" style="background-image:url('<?php echo htmlspecialchars($flash['image'] ?? ''); ?>')"></div>
        </div>
    </section>

    <!-- Who We Are -->
    <section class="who-we-are">
        <div class="who-container">
            <div class="who-image" style="background-image:url('<?php echo htmlspecialchars($who['image'] ?? ''); ?>')"></div>
            <div class="who-content">
                <h2><?php echo htmlspecialchars($who['title'] ?? ''); ?></h2>
                <p><?php echo htmlspecialchars($who['description'] ?? ''); ?></p>
                <a href="<?php echo htmlspecialchars($who['btn_link'] ?? '#'); ?>" class="learn-more-btn">
                    <?php echo htmlspecialchars($who['btn_text'] ?? 'Learn More'); ?>
                </a>
            </div>
        </div>
    </section>

    <!-- Latest News -->
    <section class="latest-news">
        <div class="news-container">
            <h2>LATEST NEWS</h2>
            <div class="news-grid">
                <?php foreach ($news_items as $news): ?>
                    <div class="news-card">
                        <div class="news-image" style="background-image:url('<?php echo htmlspecialchars($news['image'] ?? ''); ?>')"></div>
                        <div class="news-content">
                            <div class="news-meta">
                                <span><?php echo htmlspecialchars($news['meta_type'] ?? ''); ?></span>
                                <span><?php echo htmlspecialchars($news['meta_date'] ?? ''); ?></span>
                            </div>
                            <?php if (!empty($news['source'])): ?>
                                <div class="news-source"><?php echo htmlspecialchars($news['source']); ?></div>
                            <?php endif; ?>
                            <h3><?php echo htmlspecialchars($news['title'] ?? ''); ?></h3>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
            <a href="#" class="see-all-btn">SEE ALL NEWS</a>
        </div>
    </section>

    <!-- Footer -->
    <footer>
        <div class="footer-container">
            <div class="footer-content">
                <?php foreach ($footer_sections as $section): ?>
                    <div class="footer-section">
                        <h3><?php echo htmlspecialchars($section['section_title'] ?? ''); ?></h3>
                        <ul>
                            <?php foreach ($footer_links[$section['id']] ?? [] as $link): ?>
                                <li>
                                    <?php if (!empty($link['link_url'])): ?>
                                        <a href="<?php echo htmlspecialchars($link['link_url']); ?>">
                                            <?php echo htmlspecialchars($link['link_text'] ?? ''); ?>
                                        </a>
                                    <?php else: ?>
                                        <?php echo htmlspecialchars($link['link_text'] ?? ''); ?>
                                    <?php endif; ?>
                                </li>
                            <?php endforeach; ?>
                        </ul>
                    </div>
                <?php endforeach; ?>
            </div>
            <div class="footer-bottom">
                <p>© <?php echo date('Y'); ?> FRI All rights reserved. | Privacy Policy | Terms of Use</p>
            </div>
        </div>
    </footer>

    <script>
        const hamburger = document.getElementById('hamburger');
        const mobileMenu = document.getElementById('mobileMenu');
        const mobileOverlay = document.getElementById('mobileOverlay');
        const closeMenu = document.getElementById('closeMenu');
        function openMenu() {
            mobileMenu.classList.add('active');
            mobileOverlay.classList.add('active');
            hamburger.classList.add('open');
            hamburger.setAttribute('aria-expanded', 'true');
            document.body.style.overflow = 'hidden';
        }
        function closeMenuFn() {
            mobileMenu.classList.remove('active');
            mobileOverlay.classList.remove('active');
            hamburger.classList.remove('open');
            hamburger.setAttribute('aria-expanded', 'false');
            document.body.style.overflow = '';
        }
        hamburger.addEventListener('click', () => {
            mobileMenu.classList.contains('active') ? closeMenuFn() : openMenu();
        });
        closeMenu.addEventListener('click', closeMenuFn);
        mobileOverlay.addEventListener('click', closeMenuFn);
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeMenuFn();
        });
    </script>
</body>
</html>