document.addEventListener('DOMContentLoaded', function() {
    // Initialize Freshdesk client
    client.init();

    // Get form elements
    const apiEndpointInput = document.getElementById('apiEndpoint');
    const apiKeyInput = document.getElementById('apiKey');
    const minConfidenceInput = document.getElementById('minConfidence');

    // Load saved values
    client.iparams.get().then(function(iparams) {
        if (iparams.apiEndpoint) apiEndpointInput.value = iparams.apiEndpoint;
        if (iparams.apiKey) apiKeyInput.value = iparams.apiKey;
        if (iparams.minConfidence) minConfidenceInput.value = iparams.minConfidence;
    });

    // Validate and save on change
    function validateAndSave() {
        const apiEndpoint = apiEndpointInput.value.trim();
        const apiKey = apiKeyInput.value.trim();
        const minConfidence = parseFloat(minConfidenceInput.value);

        // Validate API endpoint
        if (!apiEndpoint) {
            client.interface.trigger("showNotify", {
                type: "warning",
                message: "API 엔드포인트를 입력해주세요."
            });
            return false;
        }

        // Validate API key
        if (!apiKey) {
            client.interface.trigger("showNotify", {
                type: "warning",
                message: "API 키를 입력해주세요."
            });
            return false;
        }

        // Validate min confidence
        if (isNaN(minConfidence) || minConfidence < 0 || minConfidence > 1) {
            client.interface.trigger("showNotify", {
                type: "warning",
                message: "최소 신뢰도는 0.0에서 1.0 사이의 값이어야 합니다."
            });
            return false;
        }

        // Save values
        client.iparams.set({
            apiEndpoint: apiEndpoint,
            apiKey: apiKey,
            minConfidence: minConfidence
        });

        return true;
    }

    // Add event listeners
    apiEndpointInput.addEventListener('change', validateAndSave);
    apiKeyInput.addEventListener('change', validateAndSave);
    minConfidenceInput.addEventListener('change', validateAndSave);
}); 