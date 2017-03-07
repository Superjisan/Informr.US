--[[
	https://developers.facebook.com/docs/messenger-platform/thread-settings/get-started-button
--]]

local isActivated = false;

if not isActivated then
	return 404
end


local PAGE_ACCESS_TOKEN = 'XXXXX'

local request = http.request{
url = 'https://graph.facebook.com/v2.6/me/thread_settings',
		method = 'post',
		params = {
			access_token = PAGE_ACCESS_TOKEN,	
		},
		data = json.stringify({
  		setting_type = "greeting",
  		greeting = {
				text = "An application that allows people to inform themselves of their state legislators in an easy way",
    	}
		}),
		headers = { 
			["Content-Type"] = "application/json",
			["Accept"] = "application/json",
		},		
}

