class ImageComponent extends ComponentBase {
    static showToolTip = true;

    constructor() { super({
    selector: 'myImage',
    template:`
            <br><br>
            &nbsp;Picture:[[imageWidth]]px; font:[[fontSize]]px;
            <button (click)="magnifyTextClicked(0)">-</button>
            <button (click)="magnifyTextClicked()">+</button>
            <button (click)="resetClicked()">Reset</button>
            <br><br>
            <div class="container" style="width:[[imageWidth]]px">
                <img [src]="src" class="img" style="width:[[imageWidth]]px;" >
                <p class="img-desc" style="font-size:[[fontSize]]px;">[[imgDescription]]</p><br>
            </div>
        `,
    style: `
        .img {
            border-radius: 5px;
        }
        .img-desc {
            text-align: center;
            color: darkgrey;
        }
        div.container {
            padding: 5px;
        }
    `,
    script: {
        props: {
            src: '',
            imgDescription: '',
        },
        data: {
            fontSize: 10,
            imageWidth: 300,
            initialValues: [10, 300],
            showTooltip: true
        },
        resetClicked(p) {
            this.showToolTipOnce();
            this.data.fontSize = this.data.initialValues[0];
            this.data.imageWidth = this.data.initialValues[1];
        },
        magnifyTextClicked(reduce) {
            this.showToolTipOnce();
            this.data.fontSize += reduce ? -2 : 2;
            this.data.imageWidth += reduce ? -80 : 80;

            if (this.data.fontSize < 0) {
                this.data.fontSize = 0;
            }

            if (this.data.imageWidth < 0) {
                this.data.imageWidth = 0;
            }
        },
        showToolTipOnce() {
            if (ImageComponent.showToolTip) {
                alert('Hue reacts to changes in components data and re-renders the view for specific component when it is necessary.');
                ImageComponent.showToolTip = false;
            }
        }
    }
});
}
}