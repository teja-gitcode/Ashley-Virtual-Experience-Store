--[[
  Ashley Experience Store — paste into a LocalScript under
  StarterGui > AshleyShop (a ScreenGui)
]]

local Players = game:GetService("Players")
local ProximityPromptService = game:GetService("ProximityPromptService")
local player = Players.LocalPlayer
local gui = script.Parent
gui.ResetOnSpawn = false
gui.IgnoreGuiInset = true

local PRODUCTS = {
	["darcy-sofa"] = { name = "Darcy Sofa", collection = "Darcy", price = 599, blurb = "Deep seats, track arms, charcoal microfiber." },
	["navi-sectional"] = { name = "Navi 3-Piece Sectional", collection = "Navi", price = 1399, blurb = "A loungey L that swallows a whole family." },
	["abinger-chair"] = { name = "Abinger Accent Chair", collection = "Abinger", price = 399, blurb = "Compact club chair with a soft sit." },
	["gerridan-table"] = { name = "Gerridan Cocktail Table", collection = "Gerridan", price = 279, blurb = "Plank-look top and an open lower shelf." },
	["gerridan-tv"] = { name = "Gerridan 60-Inch TV Stand", collection = "Gerridan", price = 399, blurb = "Cabinets, cubbies, cable cutouts." },
	["brinxton-bed"] = { name = "Brinxton Queen Panel Bed", collection = "Brinxton", price = 499, blurb = "Tall quiet headboard in charcoal oak." },
	["anarasia-nightstand"] = { name = "Anarasia Nightstand", collection = "Anarasia", price = 179, blurb = "One drawer, one cubby, USB-ready top." },
	["porter-dresser"] = { name = "Porter Dresser", collection = "Porter", price = 699, blurb = "Six drawers with burnished hardware." },
	["willowton-bed"] = { name = "Willowton Queen Panel Bed", collection = "Willowton", price = 549, blurb = "Whitewash plank, coastal not theme-park." },
	["bolanburg-table"] = { name = "Bolanburg Dining Table", collection = "Bolanburg", price = 649, blurb = "Thick plank top on a two-tone trestle." },
	["bolanburg-chair"] = { name = "Bolanburg Dining Chair", collection = "Bolanburg", price = 149, blurb = "Lattice back, upholstered seat." },
	["haddigan-buffet"] = { name = "Haddigan Server", collection = "Haddigan", price = 599, blurb = "Wine storage, drawers, serving top." },
	["chime-12"] = { name = "Chime 12-Inch Memory Foam", collection = "Chime", price = 399, blurb = "Pressure-relieving foam, cool-touch cover." },
	["chime-10"] = { name = "Chime 10-Inch Memory Foam", collection = "Chime", price = 299, blurb = "Guest-room workhorse." },
	["sleep-hybrid"] = { name = "Ashley Sleep 13-Inch Hybrid", collection = "Ashley Sleep", price = 699, blurb = "Coils for bounce, foam for hush." },
	["beachcroft-sofa"] = { name = "Beachcroft Outdoor Sofa", collection = "Beachcroft", price = 899, blurb = "All-weather weave, living-room sit." },
	["beachcroft-table"] = { name = "Beachcroft Coffee Table", collection = "Beachcroft", price = 349, blurb = "Open slat top for summer storms." },
	["palmetto-dining"] = { name = "Palmetto Heights Dining Set", collection = "Palmetto Heights", price = 1199, blurb = "Six-seat outdoor table, umbrella-ready." },
}

local bag = {}

local function corner(inst, r)
	local c = Instance.new("UICorner")
	c.CornerRadius = UDim.new(0, r)
	c.Parent = inst
end

local function pad(inst, px)
	local p = Instance.new("UIPadding")
	p.PaddingTop = UDim.new(0, px)
	p.PaddingBottom = UDim.new(0, px)
	p.PaddingLeft = UDim.new(0, px)
	p.PaddingRight = UDim.new(0, px)
	p.Parent = inst
end

local hud = Instance.new("TextLabel")
hud.Name = "Brand"
hud.BackgroundColor3 = Color3.fromRGB(27, 38, 52)
hud.BackgroundTransparency = 0.15
hud.Text = "  ASHLEY  ·  Experience Store"
hud.Font = Enum.Font.GothamBold
hud.TextColor3 = Color3.fromRGB(244, 239, 230)
hud.TextSize = 18
hud.TextXAlignment = Enum.TextXAlignment.Left
hud.Size = UDim2.fromOffset(320, 44)
hud.Position = UDim2.new(0, 16, 0, 16)
hud.Parent = gui
corner(hud, 8)

local bagLabel = Instance.new("TextLabel")
bagLabel.Name = "BagCount"
bagLabel.BackgroundColor3 = Color3.fromRGB(244, 129, 32)
bagLabel.Text = "Bag 0"
bagLabel.Font = Enum.Font.GothamBold
bagLabel.TextColor3 = Color3.fromRGB(27, 38, 52)
bagLabel.TextSize = 16
bagLabel.Size = UDim2.fromOffset(88, 44)
bagLabel.Position = UDim2.new(1, -104, 0, 16)
bagLabel.Parent = gui
corner(bagLabel, 8)

local sheet = Instance.new("Frame")
sheet.Name = "Tag"
sheet.Visible = false
sheet.BackgroundColor3 = Color3.fromRGB(250, 247, 242)
sheet.Size = UDim2.fromOffset(340, 280)
sheet.Position = UDim2.new(1, -360, 1, -300)
sheet.Parent = gui
corner(sheet, 16)
pad(sheet, 20)

local kicker = Instance.new("TextLabel")
kicker.BackgroundTransparency = 1
kicker.Size = UDim2.new(1, -36, 0, 18)
kicker.Font = Enum.Font.Gotham
kicker.TextColor3 = Color3.fromRGB(217, 108, 18)
kicker.TextSize = 12
kicker.TextXAlignment = Enum.TextXAlignment.Left
kicker.Text = "COLLECTION"
kicker.Parent = sheet

local title = Instance.new("TextLabel")
title.BackgroundTransparency = 1
title.Position = UDim2.fromOffset(0, 22)
title.Size = UDim2.new(1, -36, 0, 56)
title.Font = Enum.Font.GothamBold
title.TextColor3 = Color3.fromRGB(28, 27, 25)
title.TextSize = 24
title.TextWrapped = true
title.TextXAlignment = Enum.TextXAlignment.Left
title.TextYAlignment = Enum.TextYAlignment.Top
title.Text = ""
title.Parent = sheet

local price = Instance.new("TextLabel")
price.BackgroundTransparency = 1
price.Position = UDim2.fromOffset(0, 80)
price.Size = UDim2.new(1, 0, 0, 28)
price.Font = Enum.Font.GothamBold
price.TextColor3 = Color3.fromRGB(28, 27, 25)
price.TextSize = 22
price.TextXAlignment = Enum.TextXAlignment.Left
price.Text = ""
price.Parent = sheet

local blurb = Instance.new("TextLabel")
blurb.BackgroundTransparency = 1
blurb.Position = UDim2.fromOffset(0, 112)
blurb.Size = UDim2.new(1, -8, 0, 64)
blurb.Font = Enum.Font.Gotham
blurb.TextColor3 = Color3.fromRGB(107, 101, 96)
blurb.TextSize = 15
blurb.TextWrapped = true
blurb.TextXAlignment = Enum.TextXAlignment.Left
blurb.TextYAlignment = Enum.TextYAlignment.Top
blurb.Text = ""
blurb.Parent = sheet

local addBtn = Instance.new("TextButton")
addBtn.Name = "Add"
addBtn.BackgroundColor3 = Color3.fromRGB(244, 129, 32)
addBtn.Size = UDim2.new(1, -8, 0, 44)
addBtn.Position = UDim2.fromOffset(0, 188)
addBtn.Font = Enum.Font.GothamBold
addBtn.Text = "Add to bag"
addBtn.TextColor3 = Color3.fromRGB(27, 38, 52)
addBtn.TextSize = 16
addBtn.AutoButtonColor = true
addBtn.Parent = sheet
corner(addBtn, 8)

local closeBtn = Instance.new("TextButton")
closeBtn.BackgroundTransparency = 1
closeBtn.Text = "X"
closeBtn.Font = Enum.Font.GothamBold
closeBtn.TextColor3 = Color3.fromRGB(107, 101, 96)
closeBtn.TextSize = 18
closeBtn.Size = UDim2.fromOffset(36, 36)
closeBtn.Position = UDim2.new(1, -44, 0, 8)
closeBtn.Parent = sheet

local currentId = nil

local function bagCount()
	local n = 0
	for _, q in pairs(bag) do
		n += q
	end
	return n
end

local function refreshBag()
	bagLabel.Text = "Bag " .. bagCount()
end

local function openTag(id)
	local info = PRODUCTS[id]
	if not info then
		return
	end
	currentId = id
	kicker.Text = string.upper(info.collection)
	title.Text = info.name
	price.Text = "$" .. tostring(info.price)
	blurb.Text = info.blurb
	addBtn.Text = bag[id] and ("Add another · " .. bag[id] .. " in bag") or "Add to bag"
	sheet.Visible = true
end

closeBtn.MouseButton1Click:Connect(function()
	sheet.Visible = false
	currentId = nil
end)

addBtn.MouseButton1Click:Connect(function()
	if not currentId then
		return
	end
	bag[currentId] = (bag[currentId] or 0) + 1
	addBtn.Text = "Add another · " .. bag[currentId] .. " in bag"
	refreshBag()
end)

ProximityPromptService.PromptTriggered:Connect(function(prompt, who)
	if who ~= player then
		return
	end
	local id = prompt:GetAttribute("ProductId")
	if typeof(id) == "string" then
		openTag(id)
	end
end)
