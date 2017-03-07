--[[
	documenation: https://developers.facebook.com/docs/messenger-platform/thread-settings/persistent-menu
--]]
local isActivated = true;

if not isActivated then
	return 404
end


local PAGE_ACCESS_TOKEN = 'XXXXXX'

local request = http.request{
url = 'https://graph.facebook.com/v2.6/me/thread_settings',
		method = 'post',
		params = {
			access_token = PAGE_ACCESS_TOKEN,	
		},
		data = json.stringify({
  		setting_type = "call_to_actions",
  		thread_state = "existing_thread",
  		call_to_actions = {{
				type = "web_url",
				title = "View Website",
				url = "https://www.informr.us/"
    	}}
		}),
		headers = { 
			["Content-Type"] = "application/json",
			["Accept"] = "application/json",
		},		
}
