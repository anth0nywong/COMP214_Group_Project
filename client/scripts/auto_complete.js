let countries = [
    { label: 'Toronto Pearson Airport (YYZ)', value: 'YYZ', city:'Toronto', country:'Canada' },
    { label: 'Narita International Airport (NRT)', value: 'NRT', city:'Tokyo', country:'Japan'  },
    { label: 'Los Angeles International Airport (LAX)', value: 'LAX', city:'Los Angeles', country:'United State' },
    { label: 'Hong Kong International Airport (HKG)', value: 'HKG', city:'Hong Kong', country:'Hong Kong' },
    { label: 'Kennedy International Airport (JFK)', value: 'JFK', city:'New York', country:'United State' },
];

let input = document.getElementById("from");

autocomplete({
    input: input,
    disableAutoSelect : false,
    emptyMsg: "No Result",
    showOnFocus : true,
    minLength : 1,
    fetch: function(text, update) {
        text = text.toLowerCase();
        var suggestions = countries.filter((n) => {return n.label.toLowerCase().startsWith(text) || n.city.toLowerCase().startsWith(text) || n.country.toLowerCase().startsWith(text) || n.value.toLowerCase().startsWith(text)} );
        update(suggestions);
    },
    onSelect: function(item) {
        input.value = item.label;
    }
});

let to = document.getElementById("to");

autocomplete({
    input: to,
    disableAutoSelect : false,
    emptyMsg: "No Result",
    showOnFocus : true,
    minLength : 1,
    fetch: function(text, update) {
        text = text.toLowerCase();
        var suggestions = countries.filter((n) => {return n.label.toLowerCase().startsWith(text) || n.city.toLowerCase().startsWith(text) || n.country.toLowerCase().startsWith(text)|| n.value.toLowerCase().startsWith(text)} );
        update(suggestions);
    },
    onSelect: function(item) {
        to.value = item.label;
    }
});