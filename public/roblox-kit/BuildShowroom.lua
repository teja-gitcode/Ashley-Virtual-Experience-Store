--[[
  Ashley Experience Store — paste into a Script under ServerScriptService
  Rebuilds the walkable showroom from Parts every time the server starts.
]]

local SCALE = 4

local function studs(x, y, z)
	return Vector3.new(x * SCALE, y * SCALE, z * SCALE)
end

local function part(props)
	local p = Instance.new("Part")
	p.Anchored = true
	p.CanCollide = props.collide ~= false
	p.CastShadow = true
	p.TopSurface = Enum.SurfaceType.Smooth
	p.BottomSurface = Enum.SurfaceType.Smooth
	p.Material = props.material or Enum.Material.SmoothPlastic
	p.Color = props.color or Color3.fromRGB(200, 190, 175)
	p.Size = props.size
	p.CFrame = props.cf
	p.Name = props.name or "Part"
	p.Parent = props.parent
	return p
end

local PRODUCTS = {
	["darcy-sofa"] = { name = "Darcy Sofa", collection = "Darcy", price = 599, color = Color3.fromRGB(44, 45, 50) },
	["navi-sectional"] = { name = "Navi 3-Piece Sectional", collection = "Navi", price = 1399, color = Color3.fromRGB(207, 198, 186) },
	["abinger-chair"] = { name = "Abinger Accent Chair", collection = "Abinger", price = 399, color = Color3.fromRGB(111, 107, 103) },
	["gerridan-table"] = { name = "Gerridan Cocktail Table", collection = "Gerridan", price = 279, color = Color3.fromRGB(181, 131, 90) },
	["gerridan-tv"] = { name = "Gerridan 60-Inch TV Stand", collection = "Gerridan", price = 399, color = Color3.fromRGB(232, 226, 214) },
	["brinxton-bed"] = { name = "Brinxton Queen Panel Bed", collection = "Brinxton", price = 499, color = Color3.fromRGB(44, 45, 50) },
	["anarasia-nightstand"] = { name = "Anarasia Nightstand", collection = "Anarasia", price = 179, color = Color3.fromRGB(232, 226, 214) },
	["porter-dresser"] = { name = "Porter Dresser", collection = "Porter", price = 699, color = Color3.fromRGB(107, 67, 40) },
	["willowton-bed"] = { name = "Willowton Queen Panel Bed", collection = "Willowton", price = 549, color = Color3.fromRGB(232, 226, 214) },
	["bolanburg-table"] = { name = "Bolanburg Dining Table", collection = "Bolanburg", price = 649, color = Color3.fromRGB(181, 131, 90) },
	["bolanburg-chair"] = { name = "Bolanburg Dining Chair", collection = "Bolanburg", price = 149, color = Color3.fromRGB(230, 221, 208) },
	["haddigan-buffet"] = { name = "Haddigan Server", collection = "Haddigan", price = 599, color = Color3.fromRGB(107, 67, 40) },
	["chime-12"] = { name = "Chime 12-Inch Memory Foam", collection = "Chime", price = 399, color = Color3.fromRGB(230, 221, 208) },
	["chime-10"] = { name = "Chime 10-Inch Memory Foam", collection = "Chime", price = 299, color = Color3.fromRGB(207, 198, 186) },
	["sleep-hybrid"] = { name = "Ashley Sleep 13-Inch Hybrid", collection = "Ashley Sleep", price = 699, color = Color3.fromRGB(42, 56, 72) },
	["beachcroft-sofa"] = { name = "Beachcroft Outdoor Sofa", collection = "Beachcroft", price = 899, color = Color3.fromRGB(215, 196, 163) },
	["beachcroft-table"] = { name = "Beachcroft Coffee Table", collection = "Beachcroft", price = 349, color = Color3.fromRGB(181, 131, 90) },
	["palmetto-dining"] = { name = "Palmetto Heights Dining Set", collection = "Palmetto Heights", price = 1199, color = Color3.fromRGB(215, 196, 163) },
}

local PLACEMENTS = {
	{ id = "darcy-sofa", x = 7.4, z = 10.6, rot = math.pi, kind = "sofa" },
	{ id = "gerridan-table", x = 7.4, z = 11.55, rot = 0, kind = "table" },
	{ id = "abinger-chair", x = 9.4, z = 11.4, rot = -math.pi * 0.7, kind = "chair" },
	{ id = "darcy-sofa", x = -14.6, z = 0.4, rot = -math.pi / 2, kind = "sofa" },
	{ id = "gerridan-table", x = -11.5, z = 0.4, rot = 0, kind = "table" },
	{ id = "abinger-chair", x = -12.4, z = 2.55, rot = math.pi * 0.15, kind = "chair" },
	{ id = "gerridan-tv", x = -6.4, z = 0.4, rot = math.pi / 2, kind = "tv" },
	{ id = "navi-sectional", x = -11.8, z = -2.15, rot = math.pi / 2, kind = "sectional" },
	{ id = "brinxton-bed", x = 14.6, z = 0.5, rot = math.pi / 2, kind = "bed" },
	{ id = "anarasia-nightstand", x = 14.6, z = 2.35, rot = math.pi / 2, kind = "nightstand" },
	{ id = "anarasia-nightstand", x = 14.6, z = -1.35, rot = math.pi / 2, kind = "nightstand" },
	{ id = "porter-dresser", x = 8.4, z = -2.85, rot = math.pi, kind = "dresser" },
	{ id = "willowton-bed", x = 8.6, z = 1.8, rot = 0, kind = "bed" },
	{ id = "bolanburg-table", x = -10.2, z = -12.0, rot = 0, kind = "diningTable" },
	{ id = "bolanburg-chair", x = -10.2, z = -10.55, rot = math.pi, kind = "chair" },
	{ id = "bolanburg-chair", x = -11.3, z = -10.55, rot = math.pi, kind = "chair" },
	{ id = "bolanburg-chair", x = -9.1, z = -10.55, rot = math.pi, kind = "chair" },
	{ id = "bolanburg-chair", x = -10.2, z = -13.45, rot = 0, kind = "chair" },
	{ id = "bolanburg-chair", x = -11.3, z = -13.45, rot = 0, kind = "chair" },
	{ id = "bolanburg-chair", x = -9.1, z = -13.45, rot = 0, kind = "chair" },
	{ id = "haddigan-buffet", x = -16.3, z = -12.0, rot = -math.pi / 2, kind = "dresser" },
	{ id = "chime-12", x = 6.2, z = -12.2, rot = math.pi / 2, kind = "mattress" },
	{ id = "chime-10", x = 10.4, z = -12.2, rot = math.pi / 2, kind = "mattress" },
	{ id = "sleep-hybrid", x = 14.6, z = -12.2, rot = math.pi / 2, kind = "mattress" },
	{ id = "beachcroft-sofa", x = -7.2, z = -25.4, rot = 0, kind = "sofa" },
	{ id = "beachcroft-table", x = -7.2, z = -23.7, rot = 0, kind = "table" },
	{ id = "palmetto-dining", x = 7.4, z = -25.0, rot = 0, kind = "diningTable" },
}

local WALL = Color3.fromRGB(196, 176, 147)
local NAVY = Color3.fromRGB(27, 38, 52)
local OAK = Color3.fromRGB(139, 94, 60)
local TRIM = Color3.fromRGB(244, 239, 230)
local CEIL = Color3.fromRGB(216, 207, 194)
local ORANGE = Color3.fromRGB(244, 129, 32)

local function cfAt(x, y, z, rot)
	return CFrame.new(studs(x, y, z)) * CFrame.Angles(0, rot or 0, 0)
end

local old = workspace:FindFirstChild("AshleyShowroom")
if old then
	old:Destroy()
end

local root = Instance.new("Folder")
root.Name = "AshleyShowroom"
root.Parent = workspace

local function wall(x, y, z, sx, sy, sz, color, name)
	return part({
		parent = root,
		name = name or "Wall",
		color = color or WALL,
		material = Enum.Material.Concrete,
		size = studs(sx, sy, sz),
		cf = cfAt(x, y, z),
	})
end

-- Floors
part({ parent = root, name = "LobbyFloor", color = Color3.fromRGB(216, 210, 200), material = Enum.Material.Tile, size = studs(36.4, 0.2, 12.2), cf = cfAt(0, -0.1, 10) })
part({ parent = root, name = "LivingFloor", color = OAK, material = Enum.Material.WoodPlanks, size = studs(16.4, 0.2, 8.1), cf = cfAt(-10, -0.1, 0) })
part({ parent = root, name = "BedroomFloor", color = Color3.fromRGB(109, 98, 88), material = Enum.Material.Carpet, size = studs(16.4, 0.2, 8.1), cf = cfAt(10, -0.1, 0) })
part({ parent = root, name = "DiningFloor", color = OAK, material = Enum.Material.WoodPlanks, size = studs(16.4, 0.2, 16.1), cf = cfAt(-10, -0.1, -12) })
part({ parent = root, name = "SleepFloor", color = Color3.fromRGB(216, 210, 200), material = Enum.Material.Tile, size = studs(16.4, 0.2, 16.1), cf = cfAt(10, -0.1, -12) })
part({ parent = root, name = "Aisle", color = OAK, material = Enum.Material.WoodPlanks, size = studs(3.5, 0.22, 40), cf = cfAt(0, -0.08, 0) })
part({ parent = root, name = "PatioDeck", color = Color3.fromRGB(154, 112, 72), material = Enum.Material.WoodPlanks, size = studs(28.5, 0.2, 10.2), cf = cfAt(0, -0.1, -25) })
part({ parent = root, name = "Grass", color = Color3.fromRGB(74, 107, 58), material = Enum.Material.Grass, size = studs(40, 0.1, 14), cf = cfAt(0, -0.2, -25) })
part({ parent = root, name = "Ceiling", color = CEIL, collide = false, size = studs(36.6, 0.2, 36.6), cf = cfAt(0, 4.5, -2) })

local t, h = 0.28, 4.5
wall(-18.15, h / 2, -2, t, h, 36.4)
wall(18.15, h / 2, -2, t, h, 36.4)
wall(-10, h / 2, 16.15, 16.2, h, t)
wall(10, h / 2, 16.15, 16.2, h, t)
wall(-10.4, h / 2, -20.15, 15.5, h, t)
wall(10.4, h / 2, -20.15, 15.5, h, t)
wall(-14.8, h / 2, 4, 6.4, h, t)
wall(-5.1, h / 2, 4, 6.6, h, t)
wall(5.1, h / 2, 4, 6.6, h, t)
wall(14.8, h / 2, 4, 6.4, h, t)
wall(-15, h / 2, -4, 6, h, t)
wall(-5, h / 2, -4, 6.6, h, t)
wall(5, h / 2, -4, 6.6, h, t)
wall(15, h / 2, -4, 6, h, t)
wall(-1.7, h / 2, 2.65, t, h, 2.7)
wall(-1.7, h / 2, -6, t, h, 9.4)
wall(-1.7, h / 2, -16.65, t, h, 6.7)
wall(1.7, h / 2, 2.65, t, h, 2.7)
wall(1.7, h / 2, -6, t, h, 9.4)
wall(1.7, h / 2, -16.65, t, h, 6.7)
wall(-18.05, 0.55, 10, 0.08, 1.1, 11, NAVY, "Wainscot")
wall(18.05, 0.55, 10, 0.08, 1.1, 11, NAVY, "Wainscot")
wall(-18.05, 0.55, 0.4, 0.08, 1.1, 7.6, NAVY, "Wainscot")
wall(18.05, 0.55, 0.4, 0.08, 1.1, 7.6, NAVY, "Wainscot")

part({ parent = root, name = "PatioFence", color = OAK, material = Enum.Material.Wood, size = studs(0.12, 1.4, 10), cf = cfAt(-14.2, 0.7, -25) })
part({ parent = root, name = "PatioFence", color = OAK, material = Enum.Material.Wood, size = studs(0.12, 1.4, 10), cf = cfAt(14.2, 0.7, -25) })
part({ parent = root, name = "PatioFence", color = OAK, material = Enum.Material.Wood, size = studs(28.6, 1.4, 0.12), cf = cfAt(0, 0.7, -30.15) })

local lighting = game:GetService("Lighting")
lighting.Brightness = 2.2
lighting.Ambient = Color3.fromRGB(90, 80, 70)
lighting.OutdoorAmbient = Color3.fromRGB(140, 150, 165)
lighting.ClockTime = 14.5
lighting.GlobalShadows = true

local function addPrompt(model, productId)
	local info = PRODUCTS[productId]
	local prompt = Instance.new("ProximityPrompt")
	prompt.ActionText = "View tag"
	prompt.ObjectText = info and info.name or productId
	prompt.HoldDuration = 0
	prompt.MaxActivationDistance = 10
	prompt.RequiresLineOfSight = false
	prompt:SetAttribute("ProductId", productId)
	prompt.Parent = model.PrimaryPart or model:FindFirstChildWhichIsA("BasePart")
end

local function furnitureModel(name, origin, rot, color, pieces, productId)
	local model = Instance.new("Model")
	model.Name = name
	model.Parent = root
	local primary
	for i, piece in ipairs(pieces) do
		local p = part({
			parent = model,
			name = piece.name or "Piece",
			color = piece.color or color,
			material = piece.material or Enum.Material.Fabric,
			size = studs(piece.s[1], piece.s[2], piece.s[3]),
			cf = origin * CFrame.Angles(0, rot, 0) * CFrame.new(studs(piece.p[1], piece.p[2], piece.p[3])),
		})
		if i == 1 then
			primary = p
		end
	end
	model.PrimaryPart = primary
	if productId then
		addPrompt(model, productId)
	end
	return model
end

local KINDS = {}

function KINDS.sofa(id, x, z, rot, color)
	furnitureModel("Sofa", cfAt(x, 0, z), rot, color, {
		{ p = { 0, 0.22, 0 }, s = { 2.35, 0.16, 0.92 } },
		{ p = { 0, 0.58, -0.36 }, s = { 2.35, 0.58, 0.22 } },
		{ p = { -1.06, 0.42, 0.04 }, s = { 0.18, 0.48, 0.92 } },
		{ p = { 1.06, 0.42, 0.04 }, s = { 0.18, 0.48, 0.92 } },
	}, id)
end

function KINDS.sectional(id, x, z, rot, color)
	KINDS.sofa(id, x, z, rot, color)
end

function KINDS.chair(id, x, z, rot, color)
	furnitureModel("Chair", cfAt(x, 0, z), rot, color, {
		{ p = { 0, 0.34, 0 }, s = { 0.7, 0.14, 0.7 } },
		{ p = { 0, 0.7, -0.28 }, s = { 0.7, 0.58, 0.12 } },
	}, id)
end

function KINDS.table(id, x, z, rot, color)
	furnitureModel("Table", cfAt(x, 0, z), rot, color, {
		{ p = { 0, 0.38, 0 }, s = { 1.25, 0.07, 0.7 }, material = Enum.Material.Wood },
		{ p = { 0, 0.18, 0 }, s = { 0.12, 0.36, 0.12 }, material = Enum.Material.Wood },
	}, id)
end

function KINDS.diningTable(id, x, z, rot, color)
	furnitureModel("DiningTable", cfAt(x, 0, z), rot, color, {
		{ p = { 0, 0.76, 0 }, s = { 2.05, 0.07, 1.0 }, material = Enum.Material.Wood },
		{ p = { -0.85, 0.38, 0 }, s = { 0.1, 0.76, 0.7 }, material = Enum.Material.Wood },
		{ p = { 0.85, 0.38, 0 }, s = { 0.1, 0.76, 0.7 }, material = Enum.Material.Wood },
	}, id)
end

function KINDS.tv(id, x, z, rot, color)
	furnitureModel("TVStand", cfAt(x, 0, z), rot, color, {
		{ p = { 0, 0.28, 0 }, s = { 1.85, 0.48, 0.42 }, material = Enum.Material.Wood },
		{ p = { 0, 1.05, -0.05 }, s = { 1.55, 0.9, 0.06 }, color = Color3.fromRGB(17, 19, 24) },
	}, id)
end

function KINDS.bed(id, x, z, rot, color)
	furnitureModel("Bed", cfAt(x, 0, z), rot, color, {
		{ p = { 0, 0.68, -0.95 }, s = { 1.72, 1.35, 0.12 }, material = Enum.Material.Wood },
		{ p = { 0, 0.48, 0.08 }, s = { 1.6, 0.22, 1.95 }, color = Color3.fromRGB(244, 241, 234) },
		{ p = { 0, 0.62, 0.2 }, s = { 1.52, 0.08, 1.4 } },
	}, id)
end

function KINDS.nightstand(id, x, z, rot, color)
	furnitureModel("Nightstand", cfAt(x, 0, z), rot, color, {
		{ p = { 0, 0.32, 0 }, s = { 0.5, 0.48, 0.4 }, material = Enum.Material.Wood },
	}, id)
end

function KINDS.dresser(id, x, z, rot, color)
	furnitureModel("Dresser", cfAt(x, 0, z), rot, color, {
		{ p = { 0, 0.5, 0 }, s = { 1.7, 0.92, 0.48 }, material = Enum.Material.Wood },
	}, id)
end

function KINDS.mattress(id, x, z, rot, color)
	furnitureModel("Mattress", cfAt(x, 0, z), rot, color, {
		{ p = { 0, 0.22, 0 }, s = { 2.05, 0.12, 1.05 }, color = Color3.fromRGB(236, 230, 219) },
		{ p = { 0, 0.42, 0 }, s = { 2.02, 0.28, 1.02 } },
	}, id)
end

for _, place in ipairs(PLACEMENTS) do
	local info = PRODUCTS[place.id]
	local fn = KINDS[place.kind] or KINDS.sofa
	fn(place.id, place.x, place.z, place.rot, info and info.color or Color3.fromRGB(80, 80, 80))
end

-- Welcome desk
furnitureModel("WelcomeDesk", cfAt(0, 0, 8.6), 0, Color3.fromRGB(107, 67, 40), {
	{ p = { 0, 0.78, 0 }, s = { 2.4, 0.06, 0.7 }, material = Enum.Material.Wood },
	{ p = { -1.05, 0.4, 0 }, s = { 0.12, 0.8, 0.66 }, material = Enum.Material.Wood },
	{ p = { 1.05, 0.4, 0 }, s = { 0.12, 0.8, 0.66 }, material = Enum.Material.Wood },
}, "darcy-sofa")

local spawn = Instance.new("SpawnLocation")
spawn.Name = "GallerySpawn"
spawn.Anchored = true
spawn.Size = Vector3.new(8, 1, 8)
spawn.CFrame = cfAt(0, 0.6, 12.4)
spawn.Neutral = true
spawn.Duration = 0
spawn.Color = ORANGE
spawn.Material = Enum.Material.SmoothPlastic
spawn.Parent = root

workspace.FallenPartsDestroyHeight = -50
print("[Ashley] Showroom built. Press E on furniture after you add ShopClient.")
