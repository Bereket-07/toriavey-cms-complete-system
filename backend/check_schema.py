from composio import ComposioToolSet, Action
import json
import src.config

def check_schema():
    toolset = ComposioToolSet()
    # Get the action schema
    actions = toolset.get_action_schemas(actions=[Action.YOUTUBE_UPLOAD_VIDEO])
    print(json.dumps(actions[0].model_dump(), indent=2))

if __name__ == "__main__":
    check_schema()
