import requests, time

API = 'http://localhost:8000/api'

def run_test(name, prompt):
    print(f'\n--- Running Test {name}: {prompt} ---')
    res = requests.post(f'{API}/clips/1/export', json={'platform_variant_id': 1, 'prompt': prompt})
    if not res.ok:
        print('Export creation failed:', res.text)
        return False
    data = res.json()
    export_id = data['export_id']
    print(f'Export ID: {export_id}')
    
    for _ in range(60):
        time.sleep(1)
        res = requests.get(f'{API}/exports/{export_id}')
        if not res.ok:
            print('Poll failed:', res.text)
            return False
        data = res.json()
        if data['status'] == 'completed':
            print('Success!', data['output_url'])
            return True
        if data['status'] == 'failed':
            print('Failed!', data['error_message'])
            return False
    print('Timeout!')
    return False

tests = [
    ('A', 'Make this video vertical.'),
    ('B', 'Make this video 5 seconds long and mute the audio.'),
    ('C', 'Add the title "Hello" at the beginning.'),
    ('D', 'Make this a 10 second vertical video, mute the audio, and add the title "My Journey" at the beginning.')
]

for name, prompt in tests:
    run_test(name, prompt)
