<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Admin — Roulette</title>
<link rel="stylesheet" href="/styles.css" />
</head>
<body>
<div class="container">
<h1>Админка</h1>


<div class="card">
<label>Пароль: <input id="pass" type="password" /></label>
<button id="login">Войти</button>
<span id="authState"></span>
</div>


<div class="card">
<button id="loadStats">Обновить статистику</button>
<pre id="stats"></pre>
</div>


<div class="card">
<h3>Призы</h3>
<button id="loadPrizes">Обновить</button>
<table id="prizes" style="width:100%; margin-top: 10px;"></table>
<h4>Добавить / Изменить</h4>
<form id="prizeForm">
<input name="id" placeholder="id (для изменения)" />
<input name="title" placeholder="title" required />
<input name="image_url" placeholder="image_url" />
<input name="value_stars" placeholder="value_stars" type="number" required />
<input name="weight_base" placeholder="weight_base" type="number" step="0.01" value="1" />
<input name="tier_mask" placeholder="tier_mask (битовая маска)" type="number" value="15" />
<label>active <input name="active" type="checkbox" checked /></label>
<button type="submit">Сохранить</button>
</form>
</div>
</div>
<script src="/admin/admin.js"></script>
</body>
</html>